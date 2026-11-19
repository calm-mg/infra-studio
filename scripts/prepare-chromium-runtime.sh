#!/bin/sh
# Ubuntu 24.04 ARM64 Jenkins agent: stage missing native dependencies without installing host packages.
set -eu

root="$PWD/artifacts/chromium-runtime"
rm -rf "$root"
mkdir -p "$root/debs/partial"

# APT resolves transitive dependencies against the agent's installed packages.
# Download-only needs neither a dpkg lock nor maintainer scripts / root privileges.
apt-get -y --download-only --no-install-recommends \
    -o Debug::NoLocking=1 -o "Dir::Cache::archives=$root/debs" install \
    libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 libatspi2.0-0t64 \
    libcairo2 libcups2t64 libdbus-1-3 libdrm2 libexpat1 libgbm1 libglib2.0-0t64 \
    libnspr4 libnss3 libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxkbcommon0 libxrandr2 fonts-noto-cjk

for deb in "$root"/debs/*.deb; do
    [ -f "$deb" ] || break  # All packages are already installed on this host.
    dpkg-deb --extract "$deb" "$root"
done
rm -rf "$root/debs"
