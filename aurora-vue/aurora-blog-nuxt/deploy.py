#!/usr/bin/env python3
"""
部署脚本（Nuxt SSR）- 构建并上传产物到服务器（远端目录名为 dist）
使用环境变量配置服务器信息
"""

import os
import shlex
import subprocess
import sys
import tarfile
from datetime import datetime
from pathlib import Path

# 从环境变量读取服务器配置
DEPLOY_HOST = os.getenv("AURORA_BLOG_SERVER_HOST")
DEPLOY_PORT = os.getenv("AURORA_BLOG_SERVER_PORT", "22")
DEPLOY_USER = os.getenv("AURORA_BLOG_SERVER_USER")
DEPLOY_PATH = os.getenv("AURORA_BLOG_SERVER_NUXT_PATH")
DEPLOY_KEY = os.getenv("DEPLOY_KEY")  # 可选
DEPLOY_PASS = os.getenv("AURORA_BLOG_SERVER_PASSWORD")  # 用户名/密码登录

# systemd 相关配置（Nuxt SSR 场景）
SYSTEMD_SERVICE = os.getenv("AURORA_BLOG_SYSTEMD_SERVICE_NUXT", "aurora-blog-nuxt.service")
SYSTEMCTL_CMD = os.getenv("AURORA_BLOG_SYSTEMCTL_CMD_NUXT", "systemctl")
SYSTEMD_SUDO_PASS = os.getenv("AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_NUXT", DEPLOY_PASS)  # 可选：远端 sudo 密码

# 构建产物目录映射：本地 Nuxt 为 .output，远端解压目录命名为 dist
LOCAL_BUILD_DIR = ".output"
REMOTE_RELEASE_DIR = "dist"


def print_step(message: str) -> None:
    """打印步骤信息"""
    print(f"\n{'=' * 60}")
    print(f"  {message}")
    print(f"{'=' * 60}\n")


def check_env() -> None:
    """检查必需环境变量"""
    required_vars = {
        "AURORA_BLOG_SERVER_HOST": DEPLOY_HOST,
        "AURORA_BLOG_SERVER_USER": DEPLOY_USER,
        "AURORA_BLOG_SERVER_NUXT_PATH": DEPLOY_PATH,
        "AURORA_BLOG_SERVER_PASSWORD": DEPLOY_PASS,
        "AURORA_BLOG_SYSTEMD_SERVICE_NUXT": SYSTEMD_SERVICE,
    }
    missing = [var for var, value in required_vars.items() if not value]
    if missing:
        print("❌ 错误：缺少必需的环境变量：")
        for var in missing:
            print(f"   - {var}")
        print("\n请设置以下环境变量：")
        print("  export AURORA_BLOG_SERVER_HOST='your.server.com'")
        print("  export AURORA_BLOG_SERVER_USER='username'")
        print("  export AURORA_BLOG_SERVER_NUXT_PATH='/path/to/aurora-blog-nuxt'")
        print("  export AURORA_BLOG_SERVER_PORT='22'  # 可选，默认 22")
        print("  export AURORA_BLOG_SERVER_PASSWORD='your-password'")
        print("  export AURORA_BLOG_SYSTEMD_SERVICE_NUXT='aurora-blog-nuxt.service'")
        print("  export AURORA_BLOG_SYSTEMCTL_CMD_NUXT='systemctl'  # 可选，需 sudo 时填 'sudo systemctl'")
        print("  export AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_NUXT='your-sudo-password'  # 可选，用于远端 sudo -S")
        print("  export DEPLOY_KEY='/path/to/ssh/key'  # 可选（改为密钥登录）")
        sys.exit(1)

    print("✅ 环境变量检查通过")
    print(f"   服务器: {DEPLOY_USER}@{DEPLOY_HOST}:{DEPLOY_PORT}")
    print(f"   部署路径: {DEPLOY_PATH}")
    print(f"   systemd 服务: {SYSTEMD_SERVICE}")
    print(f"   systemctl 命令: {SYSTEMCTL_CMD}")
    if SYSTEMD_SUDO_PASS:
        print("   systemctl sudo 密码: 已配置")


def run_command(command: str, cwd: str | None = None) -> bool:
    """执行命令并实时输出"""
    try:
        process = subprocess.Popen(
            command,
            shell=True,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
        )
        if process.stdout is not None:
            for line in iter(process.stdout.readline, ""):
                if not line:
                    break
                print(line, end="")
        else:
            out, _ = process.communicate()
            if out:
                print(out)

        process.wait()
        if process.returncode != 0:
            raise subprocess.CalledProcessError(process.returncode, command)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 命令执行失败: {command}")
        print(f"   错误码: {e.returncode}")
        return False


def build_project() -> None:
    """执行 Nuxt SSR 构建"""
    print_step("📦 开始构建项目（pnpm build）")
    if not run_command("pnpm build"):
        print("❌ 构建失败")
        sys.exit(1)
    print("✅ 构建成功")


def compress_output() -> str:
    """压缩构建目录（本地 .output，远端目录名 dist）"""
    print_step("🗜️  压缩构建目录（.output -> dist）")

    output_path = Path(LOCAL_BUILD_DIR)
    if not output_path.exists():
        print(f"❌ {LOCAL_BUILD_DIR} 目录不存在")
        sys.exit(1)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"output_{timestamp}.tar.gz"

    try:
        with tarfile.open(archive_name, "w:gz") as tar:
            tar.add(LOCAL_BUILD_DIR, arcname=REMOTE_RELEASE_DIR)

        file_size = os.path.getsize(archive_name) / (1024 * 1024)
        print(f"✅ 压缩完成: {archive_name} ({file_size:.2f} MB)")
        return archive_name
    except Exception as e:  # noqa: BLE001
        print(f"❌ 压缩失败: {e}")
        sys.exit(1)


def upload_to_server(archive_name: str) -> None:
    """上传到服务器"""
    print_step("🚀 上传到服务器")

    scp_options = [
        f"-P {DEPLOY_PORT}",
        "-o StrictHostKeyChecking=no",
        "-o UserKnownHostsFile=/dev/null",
    ]

    scp_prefix = ""
    if DEPLOY_PASS:
        scp_options.append("-o PreferredAuthentications=password")
        scp_prefix = f"sshpass -p {shlex.quote(DEPLOY_PASS)} "
    elif DEPLOY_KEY:
        scp_options.append(f"-i {DEPLOY_KEY}")

    remote_target = f"{DEPLOY_USER}@{DEPLOY_HOST}:{DEPLOY_PATH}/"
    scp_cmd = f"{scp_prefix}scp {' '.join(scp_options)} {shlex.quote(archive_name)} {remote_target}"

    if not run_command(scp_cmd):
        print("❌ 上传失败")
        sys.exit(1)

    print(f"✅ 上传成功: {DEPLOY_PATH}/{archive_name}")
    extract_and_switch_on_server(archive_name)

    print(f"\n🧹 清理本地文件: {archive_name}")
    os.remove(archive_name)


def extract_and_switch_on_server(archive_name: str) -> None:
    """
    在服务器上原子替换 dist 并重启 systemd 服务
    失败时回滚到旧版本
    """
    print_step("📂 服务器解压并切换版本（含服务重启）")

    ssh_options = [
        f"-p {DEPLOY_PORT}",
        "-o StrictHostKeyChecking=no",
        "-o UserKnownHostsFile=/dev/null",
    ]

    ssh_prefix = ""
    if DEPLOY_PASS:
        ssh_options.append("-o PreferredAuthentications=password")
        ssh_prefix = f"sshpass -p {shlex.quote(DEPLOY_PASS)} "
    elif DEPLOY_KEY:
        ssh_options.append(f"-i {DEPLOY_KEY}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"{REMOTE_RELEASE_DIR}_backup_{timestamp}"
    service = shlex.quote(SYSTEMD_SERVICE or "")
    systemctl = SYSTEMCTL_CMD or "systemctl"
    systemctl_run = systemctl

    sudo_setup = ""
    if SYSTEMD_SUDO_PASS:
        sudo_setup = (
            f"SYSTEMD_SUDO_PASSWORD={shlex.quote(SYSTEMD_SUDO_PASS)}\n"
            "systemctl_exec() {\n"
            "  printf '%s\\n' \"$SYSTEMD_SUDO_PASSWORD\" | sudo -S -p '' systemctl \"$@\"\n"
            "}\n"
        )
        systemctl_run = "systemctl_exec"

    remote_script = f"""
set -e
{sudo_setup}
mkdir -p {shlex.quote(DEPLOY_PATH)}
cd {shlex.quote(DEPLOY_PATH)}

if [ -d {shlex.quote(REMOTE_RELEASE_DIR)} ]; then
  mv {shlex.quote(REMOTE_RELEASE_DIR)} {shlex.quote(backup_dir)}
fi

tar -xzf {shlex.quote(archive_name)}
rm -f {shlex.quote(archive_name)}

if ! {systemctl_run} restart {service}; then
  echo "服务重启失败，开始回滚..."
  rm -rf {shlex.quote(REMOTE_RELEASE_DIR)}
  if [ -d {shlex.quote(backup_dir)} ]; then
    mv {shlex.quote(backup_dir)} {shlex.quote(REMOTE_RELEASE_DIR)}
  fi
  {systemctl_run} restart {service}
  exit 1
fi

if ! {systemctl_run} is-active --quiet {service}; then
  echo "服务未处于 active，开始回滚..."
  rm -rf {shlex.quote(REMOTE_RELEASE_DIR)}
  if [ -d {shlex.quote(backup_dir)} ]; then
    mv {shlex.quote(backup_dir)} {shlex.quote(REMOTE_RELEASE_DIR)}
  fi
  {systemctl_run} restart {service}
  exit 1
fi

find . -maxdepth 1 -type d -name "{REMOTE_RELEASE_DIR}_backup_*" -mtime +7 -exec rm -rf {{}} +
echo "部署成功，服务已运行新版本"
"""

    ssh_cmd = (
        f"{ssh_prefix}ssh {' '.join(ssh_options)} {DEPLOY_USER}@{DEPLOY_HOST} "
        f"bash -lc {shlex.quote(remote_script)}"
    )

    if not run_command(ssh_cmd):
        print("❌ 远程部署或服务切换失败")
        print("   提示：若报 Interactive authentication required，请设置：")
        print("   export AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_NUXT='your-sudo-password'")
        print("   或配置 sudoers NOPASSWD 并将 AURORA_BLOG_SYSTEMCTL_CMD_NUXT 设为 'sudo systemctl'")
        sys.exit(1)

    print("✅ 远程部署完成，服务已切换到新版本")


def main() -> None:
    """主函数"""
    print_step("🌙 小月的 Nuxt SSR 部署脚本启动")
    check_env()
    build_project()
    archive_name = compress_output()
    upload_to_server(archive_name)
    print_step("✨ 部署完成")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  部署已取消")
        sys.exit(1)
    except Exception as e:  # noqa: BLE001
        print(f"\n❌ 发生错误: {e}")
        sys.exit(1)
