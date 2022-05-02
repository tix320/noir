declare module "*.module.css";

declare module "*.jpg";
declare module "*.png";
declare module "*.jpeg";
declare module "*.gif";

declare module '*.scss' {
    const content: { [className: string]: string };
    export = content;
}