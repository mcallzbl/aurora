#!/usr/bin/env python3
"""
部署脚本 - 构建并上传dist到服务器
使用环境变量配置服务器信息
"""

import os
import sys
import subprocess
import tarfile
import shlex
from datetime import datetime
from pathlib import Path

ENV_PREFIX = "AURORA_ADMIN"


def env_key(name):
    return f"{ENV_PREFIX}_{name}"


def env_get(name, default=None):
    return os.getenv(env_key(name), default)


# 从环境变量读取服务器配置
DEPLOY_HOST = env_get("SERVER_HOST")
DEPLOY_PORT = env_get("SERVER_PORT", "22")  # 端口（从环境变量读取，默认22）
DEPLOY_USER = env_get("SERVER_USER")
DEPLOY_PATH = env_get("SERVER_PATH")
DEPLOY_KEY = env_get("DEPLOY_KEY")  # SSH私钥路径（可选）
DEPLOY_PASS = env_get("SERVER_PASSWORD")  # SSH密码（用户名/密码登录）


def print_step(message):
    """打印步骤信息"""
    print(f"\n{'=' * 60}")
    print(f"  {message}")
    print(f"{'=' * 60}\n")


def check_env():
    """检查必需的环境变量"""
    # 要求使用用户名/密码登录
    required_vars = {
        env_key("SERVER_HOST"): DEPLOY_HOST,
        env_key("SERVER_USER"): DEPLOY_USER,
        env_key("SERVER_PATH"): DEPLOY_PATH,
        env_key("SERVER_PASSWORD"): DEPLOY_PASS,
    }

    missing = [var for var, value in required_vars.items() if not value]

    if missing:
        print("❌ 错误：缺少必需的环境变量：")
        for var in missing:
            print(f"   - {var}")
        print("\n请设置以下环境变量（用户名/密码登录）：")
        print(f"  export {env_key('SERVER_HOST')}='your.server.com'")
        print(f"  export {env_key('SERVER_USER')}='username'")
        print(f"  export {env_key('SERVER_PATH')}='/path/to/deploy'")
        print(f"  export {env_key('SERVER_PORT')}='22'  # 端口，可选，默认22")
        print(f"  export {env_key('SERVER_PASSWORD')}='your-password'")
        print(f"  export {env_key('DEPLOY_KEY')}='/path/to/ssh/key'  # 可选（如改回密钥登录）")
        sys.exit(1)

    print("✅ 环境变量检查通过")
    print(f"   服务器: {DEPLOY_USER}@{DEPLOY_HOST}:{DEPLOY_PORT}")
    print(f"   路径: {DEPLOY_PATH}")


def run_command(command, cwd=None):
    """执行命令并实时输出（更健壮的输出处理）"""
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
            # 退化路径：无 stdout 管道时统一读取
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


def build_project():
    """执行 pnpm build"""
    print_step("📦 开始构建项目")

    if not run_command("pnpm build"):
        print("❌ 构建失败")
        sys.exit(1)

    print("✅ 构建成功")


def compress_dist():
    """压缩 dist 目录"""
    print_step("🗜️  压缩 dist 目录")

    dist_path = Path("dist")
    if not dist_path.exists():
        print("❌ dist 目录不存在")
        sys.exit(1)

    # 生成带时间戳的压缩包名称
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_name = f"dist_{timestamp}.tar.gz"

    try:
        with tarfile.open(archive_name, "w:gz") as tar:
            tar.add("dist", arcname="dist")

        file_size = os.path.getsize(archive_name) / (1024 * 1024)
        print(f"✅ 压缩完成: {archive_name} ({file_size:.2f} MB)")
        return archive_name

    except Exception as e:
        print(f"❌ 压缩失败: {e}")
        sys.exit(1)


def upload_to_server(archive_name):
    """上传到服务器"""
    print_step("🚀 上传到服务器")

    # 构建 SCP 命令（优先使用用户名/密码登录）
    scp_options = [
        f"-P {DEPLOY_PORT}",
        "-o StrictHostKeyChecking=no",
        "-o UserKnownHostsFile=/dev/null",
    ]

    scp_prefix = ""
    if DEPLOY_PASS:
        # 使用密码方式
        scp_options.append("-o PreferredAuthentications=password")
        scp_prefix = f"sshpass -p {shlex.quote(DEPLOY_PASS)} "
    elif DEPLOY_KEY:
        # 使用私钥方式（可选）
        scp_options.append(f"-i {DEPLOY_KEY}")

    scp_cmd = (
        f"{scp_prefix}scp {' '.join(scp_options)} {shlex.quote(archive_name)} "
        f"{DEPLOY_USER}@{DEPLOY_HOST}:{DEPLOY_PATH}/"
    )

    if not run_command(scp_cmd):
        print("❌ 上传失败")
        sys.exit(1)

    print(f"✅ 上传成功: {DEPLOY_PATH}/{archive_name}")

    # 询问是否在服务器上解压
    print("\n是否在服务器上自动解压并替换？(y/N): ", end="")
    response = input().strip().lower()

    if response == "y":
        extract_on_server(archive_name)

    # 清理本地压缩包
    print(f"\n🧹 清理本地文件: {archive_name}")
    os.remove(archive_name)


def extract_on_server(archive_name):
    """在服务器上解压"""
    print_step("📂 在服务器上解压")

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

    # 备份旧版本，解压新版本
    remote_cmd = f"""
        cd {DEPLOY_PATH} && \
        [ -d dist_backup ] && rm -rf dist_backup; \
        [ -d dist ] && mv dist dist_backup; \
        tar -xzf {archive_name} && \
        echo '解压完成' && \
        rm {archive_name}
    """

    ssh_cmd = (
        f"{ssh_prefix}ssh {' '.join(ssh_options)} {DEPLOY_USER}@{DEPLOY_HOST} "
        f"'{remote_cmd}'"
    )

    if not run_command(ssh_cmd):
        print("❌ 远程解压失败")
        sys.exit(1)

    print("✅ 远程解压成功")


def main():
    """主函数"""
    print_step("🌙 小月的部署脚本启动")

    # 检查环境变量
    check_env()

    # 构建项目
    build_project()

    # 压缩 dist
    archive_name = compress_dist()

    # 上传到服务器
    upload_to_server(archive_name)

    print_step("✨ 部署完成")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  部署已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        sys.exit(1)
