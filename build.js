/**
 * Typora AI Plugin 构建脚本
 * 
 * 功能：
 * - 合并 CSS 和 JS
 * - 压缩代码
 * - 生成最终可用的单文件
 */

const fs = require('fs');
const path = require('path');

// 尝试导入压缩工具，如果不存在则使用简单复制
let CleanCSS, terser;
try {
    CleanCSS = require('clean-css');
} catch (e) {
    console.log('⚠ clean-css 未安装，将输出未压缩的 CSS');
}

try {
    terser = require('terser');
} catch (e) {
    console.log('⚠ terser 未安装，将输出未压缩的 JS');
}

const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

async function build() {
    console.log('🔨 开始构建 Typora AI Plugin...\n');

    // 读取源文件
    const cssContent = fs.readFileSync(path.join(srcDir, 'aiChat.css'), 'utf-8');
    const jsContent = fs.readFileSync(path.join(srcDir, 'aiChat.js'), 'utf-8');

    // 处理 CSS
    let finalCSS = cssContent;
    if (CleanCSS) {
        const cleanCssResult = new CleanCSS({ level: 2 }).minify(cssContent);
        if (cleanCssResult.errors.length === 0) {
            finalCSS = cleanCssResult.styles;
            console.log('✅ CSS 压缩完成');
        } else {
            console.log('⚠ CSS 压缩失败，使用原始文件');
        }
    }

    // 处理 JS
    let finalJS = jsContent;
    if (terser) {
        try {
            const terserResult = await terser.minify(jsContent, {
                compress: true,
                mangle: true,
                format: {
                    comments: false
                }
            });
            if (terserResult.code) {
                finalJS = terserResult.code;
                console.log('✅ JS 压缩完成');
            }
        } catch (e) {
            console.log('⚠ JS 压缩失败，使用原始文件');
        }
    }

    // 生成合并后的 JS（将 CSS 内联）
    const combinedContent = `
/**
 * Typora AI Chat Plugin v1.0.0
 * https://github.com/your-repo/typora-ai-plugin
 */
(function() {
    // 注入样式
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(finalCSS)};
    document.head.appendChild(style);
})();

${finalJS}
`;

    // 写入文件
    fs.writeFileSync(path.join(distDir, 'aiChat.js'), combinedContent);
    fs.writeFileSync(path.join(distDir, 'aiChat.css'), finalCSS);
    fs.writeFileSync(path.join(distDir, 'aiChat.min.js'), finalJS);

    // 复制原始文件到 dist（用于调试）
    fs.writeFileSync(path.join(distDir, 'aiChat.src.js'), jsContent);
    fs.writeFileSync(path.join(distDir, 'aiChat.src.css'), cssContent);

    console.log('\n📦 构建完成！输出文件：');
    console.log('   dist/aiChat.js      - 完整版（包含内联 CSS）');
    console.log('   dist/aiChat.css     - 压缩后的样式');
    console.log('   dist/aiChat.min.js  - 压缩后的脚本');
    console.log('   dist/aiChat.src.js  - 源码（调试用）');
    console.log('   dist/aiChat.src.css - 源码（调试用）');
    console.log('\n📖 安装方法请查看 README.md');
}

build().catch(err => {
    console.error('❌ 构建失败:', err);
    process.exit(1);
});
