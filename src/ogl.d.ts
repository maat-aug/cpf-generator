declare module 'ogl' {
  export class Renderer {
    constructor(options?: Record<string, unknown>);
    gl: WebGL2RenderingContext & { canvas: HTMLCanvasElement };
    setSize(width: number, height: number): void;
    render(options: { scene: unknown }): void;
  }
  export class Program {
    constructor(gl: unknown, options: Record<string, unknown>);
    uniforms: Record<string, { value: any }>;
  }
  export class Mesh {
    constructor(gl: unknown, options: Record<string, unknown>);
  }
  export class Triangle {
    constructor(gl: unknown);
  }
}
