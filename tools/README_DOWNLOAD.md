下载脚本说明

免责声明：仅在你拥有下载权限的情况下使用本工具（著作权人许可或公共领域内容）。不得用于绕过版权、DRM 或服务条款。

要求：
- Python 3.8+
- 推荐安装：yt-dlp, ffmpeg

安装：

```bash
# 建议在虚拟环境中安装
pip install yt-dlp
# macOS 用户可用 brew
brew install yt-dlp ffmpeg
```

用法示例：

```bash
# 交互式确认权限后下载
python3 tools/download_video.py "https://example.com/video-page"

# 已确认权限，非交互模式，指定输出目录
python3 tools/download_video.py "https://example.com/video-page" -o ~/Videos --confirm

# 使用 shell 包装器（若系统安装了 yt-dlp，会优先用系统 yt-dlp）
bash tools/download_video.sh "https://example.com/video-page"
```

当遇到 m3u8（HLS）流，yt-dlp 会自动处理并用 ffmpeg 合并（若可用）。

若需要我把脚本调整为自动抓取页面内的隐藏媒体链接（例如解析特定站点的 JS），请先确认你完全拥有处理该页面内容的权限。