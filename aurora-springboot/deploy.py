#!/usr/bin/env python3
"""
后端部署脚本（Spring Boot）
功能：mvn 打包 JAR -> 上传服务器 -> 原子替换 -> 重启 systemd 服务
"""

import os
import shlex
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# 服务器配置
DEPLOY_HOST = os.getenv("AURORA_BLOG_SERVER_HOST")
DEPLOY_PORT = os.getenv("AURORA_BLOG_SERVER_PORT", "22")
DEPLOY_USER = os.getenv("AURORA_BLOG_SERVER_USER")
DEPLOY_PATH = os.getenv("AURORA_BLOG_SERVER_BACKEND_PATH", "/home/ubuntu/aurora/backend")
DEPLOY_KEY = os.getenv("DEPLOY_KEY")  # 可选：密钥登录
DEPLOY_PASS = os.getenv("AURORA_BLOG_SERVER_PASSWORD")  # 可选：密码登录

# 构建配置
MVN_BUILD_CMD = os.getenv("AURORA_BLOG_BACKEND_MVN_CMD", "mvn clean package -DskipTests")
REMOTE_JAR_NAME = os.getenv("AURORA_BLOG_BACKEND_REMOTE_JAR", "aurora-springboot.jar")
REMOTE_UPLOAD_TMP_DIR = os.getenv("AURORA_BLOG_BACKEND_UPLOAD_TMP_DIR", "/tmp")

# systemd 配置
SYSTEMD_SERVICE = os.getenv("AURORA_BLOG_SYSTEMD_SERVICE_BACKEND", "aurora-backend.service")
SYSTEMCTL_CMD = os.getenv("AURORA_BLOG_SYSTEMCTL_CMD_BACKEND", "systemctl")
SYSTEMD_SUDO_PASS = os.getenv("AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_BACKEND", DEPLOY_PASS)


def print_step(message: str) -> None:
    """打印步骤信息"""
    print(f"\n{'=' * 60}")
    print(f"  {message}")
    print(f"{'=' * 60}\n")


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
    except subprocess.CalledProcessError as error:
        print(f"❌ 命令执行失败: {command}")
        print(f"   错误码: {error.returncode}")
        return False


def check_env() -> None:
    """检查必需环境变量"""
    required = {
        "AURORA_BLOG_SERVER_HOST": DEPLOY_HOST,
        "AURORA_BLOG_SERVER_USER": DEPLOY_USER,
    }
    missing = [name for name, value in required.items() if not value]
    if missing:
        print("❌ 错误：缺少必需的环境变量：")
        for name in missing:
            print(f"   - {name}")
        print("\n请设置以下环境变量：")
        print("  export AURORA_BLOG_SERVER_HOST='your.server.com'")
        print("  export AURORA_BLOG_SERVER_USER='ubuntu'")
        print("  export AURORA_BLOG_SERVER_PORT='22'  # 可选，默认 22")
        print("  export AURORA_BLOG_SERVER_BACKEND_PATH='/home/ubuntu/aurora/backend'  # 可选")
        print("  export AURORA_BLOG_SERVER_PASSWORD='your-password'  # 密码登录时必填")
        print("  export DEPLOY_KEY='/path/to/id_rsa'  # 密钥登录时可选")
        print("  export AURORA_BLOG_BACKEND_MVN_CMD='mvn clean package -DskipTests'  # 可选")
        print("  export AURORA_BLOG_BACKEND_REMOTE_JAR='aurora-springboot.jar'  # 可选")
        print("  export AURORA_BLOG_BACKEND_UPLOAD_TMP_DIR='/tmp'  # 可选")
        print("  export AURORA_BLOG_SYSTEMD_SERVICE_BACKEND='aurora-backend.service'  # 可选")
        print("  export AURORA_BLOG_SYSTEMCTL_CMD_BACKEND='systemctl'  # 可选")
        print("  export AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_BACKEND='your-sudo-password'  # 可选")
        sys.exit(1)

    if not DEPLOY_PASS and not DEPLOY_KEY:
        print("❌ 错误：请至少配置一种登录方式：")
        print("   - AURORA_BLOG_SERVER_PASSWORD（密码登录）")
        print("   - DEPLOY_KEY（SSH 密钥登录）")
        sys.exit(1)

    print("✅ 环境变量检查通过")
    print(f"   服务器: {DEPLOY_USER}@{DEPLOY_HOST}:{DEPLOY_PORT}")
    print(f"   部署路径: {DEPLOY_PATH}")
    print(f"   远端上传临时目录: {REMOTE_UPLOAD_TMP_DIR}")
    print(f"   远端 JAR 名: {REMOTE_JAR_NAME}")
    print(f"   systemd 服务: {SYSTEMD_SERVICE}")
    print(f"   Maven 命令: {MVN_BUILD_CMD}")
    if DEPLOY_KEY:
        print(f"   SSH 密钥: {DEPLOY_KEY}")
    if SYSTEMD_SUDO_PASS:
        print("   systemctl sudo 密码: 已配置")


def build_project() -> Path:
    """执行 Maven 构建并返回待部署 JAR"""
    print_step("📦 开始构建后端（Maven）")
    if not run_command(MVN_BUILD_CMD):
        print("❌ 构建失败")
        sys.exit(1)

    target_dir = Path("target")
    if not target_dir.exists():
        print("❌ target 目录不存在，无法找到构建产物")
        sys.exit(1)

    jar_candidates = [
        jar
        for jar in target_dir.glob("*.jar")
        if "original" not in jar.name
        and not jar.name.endswith("-sources.jar")
        and not jar.name.endswith("-javadoc.jar")
    ]
    if not jar_candidates:
        print("❌ 未在 target 目录中找到可部署 JAR")
        sys.exit(1)

    jar_path = max(jar_candidates, key=lambda item: item.stat().st_mtime)
    size_mb = jar_path.stat().st_size / (1024 * 1024)
    print(f"✅ 构建成功，选中 JAR: {jar_path} ({size_mb:.2f} MB)")
    return jar_path


def upload_jar(jar_path: Path) -> None:
    """上传 JAR 到服务器"""
    print_step("🚀 上传 JAR 到服务器")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    remote_tmp_name = f"{REMOTE_JAR_NAME}.new.{timestamp}"
    remote_tmp_path = f"{REMOTE_UPLOAD_TMP_DIR.rstrip('/')}/{remote_tmp_name}"
    remote_target = f"{DEPLOY_USER}@{DEPLOY_HOST}:{remote_tmp_path}"
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
        scp_options.append(f"-i {shlex.quote(DEPLOY_KEY)}")

    upload_cmd = (
        f"{scp_prefix}scp {' '.join(scp_options)} "
        f"{shlex.quote(str(jar_path))} {shlex.quote(remote_target)}"
    )
    if not run_command(upload_cmd):
        print("❌ 上传失败")
        sys.exit(1)

    print(f"✅ 上传成功: {remote_tmp_path}")
    switch_and_restart(remote_tmp_path)


def switch_and_restart(remote_tmp_path: str) -> None:
    """远端替换 JAR 并重启服务，失败自动回滚"""
    print_step("🔄 远端替换 JAR 并重启服务")

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
        ssh_options.append(f"-i {shlex.quote(DEPLOY_KEY)}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"{REMOTE_JAR_NAME}.backup.{timestamp}"
    service_name = shlex.quote(SYSTEMD_SERVICE)

    sudo_setup = ""
    systemctl_run = SYSTEMCTL_CMD
    privileged_run = ""
    if SYSTEMD_SUDO_PASS:
        sudo_setup = (
            f"SYSTEMD_SUDO_PASSWORD={shlex.quote(SYSTEMD_SUDO_PASS)}\n"
            "systemctl_exec() {\n"
            "  printf '%s\\n' \"$SYSTEMD_SUDO_PASSWORD\" | sudo -S -p '' systemctl \"$@\"\n"
            "}\n"
            "privileged_exec() {\n"
            "  printf '%s\\n' \"$SYSTEMD_SUDO_PASSWORD\" | sudo -S -p '' \"$@\"\n"
            "}\n"
        )
        systemctl_run = "systemctl_exec"
        privileged_run = "privileged_exec"
    else:
        privileged_run = ""

    remote_script = f"""
set -e
{sudo_setup}
if [ -n {shlex.quote(privileged_run)} ]; then
  {privileged_run} mkdir -p {shlex.quote(DEPLOY_PATH)}
else
  mkdir -p {shlex.quote(DEPLOY_PATH)}
fi
cd {shlex.quote(DEPLOY_PATH)}

if [ -f {shlex.quote(REMOTE_JAR_NAME)} ]; then
  if [ -n {shlex.quote(privileged_run)} ]; then
    {privileged_run} cp -f {shlex.quote(REMOTE_JAR_NAME)} {shlex.quote(backup_name)}
  else
    cp -f {shlex.quote(REMOTE_JAR_NAME)} {shlex.quote(backup_name)}
  fi
fi

if [ -n {shlex.quote(privileged_run)} ]; then
  {privileged_run} mv -f {shlex.quote(remote_tmp_path)} {shlex.quote(REMOTE_JAR_NAME)}
else
  mv -f {shlex.quote(remote_tmp_path)} {shlex.quote(REMOTE_JAR_NAME)}
fi

if ! {systemctl_run} restart {service_name}; then
  echo "服务重启失败，开始回滚..."
  if [ -f {shlex.quote(backup_name)} ]; then
    if [ -n {shlex.quote(privileged_run)} ]; then
      {privileged_run} mv -f {shlex.quote(backup_name)} {shlex.quote(REMOTE_JAR_NAME)}
    else
      mv -f {shlex.quote(backup_name)} {shlex.quote(REMOTE_JAR_NAME)}
    fi
  fi
  {systemctl_run} restart {service_name}
  exit 1
fi

if ! {systemctl_run} is-active --quiet {service_name}; then
  echo "服务未处于 active，开始回滚..."
  if [ -f {shlex.quote(backup_name)} ]; then
    if [ -n {shlex.quote(privileged_run)} ]; then
      {privileged_run} mv -f {shlex.quote(backup_name)} {shlex.quote(REMOTE_JAR_NAME)}
    else
      mv -f {shlex.quote(backup_name)} {shlex.quote(REMOTE_JAR_NAME)}
    fi
  fi
  {systemctl_run} restart {service_name}
  exit 1
fi

if [ -n {shlex.quote(privileged_run)} ]; then
  {privileged_run} find . -maxdepth 1 -type f -name "{REMOTE_JAR_NAME}.backup.*" -mtime +7 -delete
else
  find . -maxdepth 1 -type f -name "{REMOTE_JAR_NAME}.backup.*" -mtime +7 -delete
fi
echo "部署成功，服务已运行新版本"
"""

    ssh_cmd = (
        f"{ssh_prefix}ssh {' '.join(ssh_options)} {DEPLOY_USER}@{DEPLOY_HOST} "
        f"bash -lc {shlex.quote(remote_script)}"
    )
    if not run_command(ssh_cmd):
        print("❌ 远程部署或服务重启失败")
        print("   提示：若报 Interactive authentication required，可设置：")
        print("   export AURORA_BLOG_SYSTEMD_SUDO_PASSWORD_BACKEND='your-sudo-password'")
        print("   或配置 sudoers NOPASSWD 后使用 systemctl")
        sys.exit(1)

    print("✅ 远程服务重启完成")


def main() -> None:
    """主函数"""
    print_step("🌙 小月的 Spring Boot 部署脚本启动")
    check_env()
    jar_path = build_project()
    upload_jar(jar_path)
    print_step("✨ 部署完成")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  部署已取消")
        sys.exit(1)
    except Exception as error:  # noqa: BLE001
        print(f"\n❌ 发生错误: {error}")
        sys.exit(1)
