// onnxruntime-web 的 package.json exports 未声明 types，按 bundler 解析时找不到类型，这里直接引用包内的声明文件；
// 它再导出 onnxruntime-common 的类型，因此 onnxruntime-common 以同版本列为 devDependency，保证能从根目录解析
/// <reference path="../../node_modules/onnxruntime-web/types.d.ts" />
