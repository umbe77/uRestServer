import { IncomingMessage } from "node:http"

interface Headers {
    [Key: string]: string;
}

interface Response {
    status: number;
    headers: Headers;
    send(message: string): void;
    json(message: object): void;
    pipStream(stream: Readable): void
}

interface MidwareResponse extends Response {
    next(): void;
}

type Handler = (req: IncomingMessage, res: Response) => void
type MidwareHandler = (req: IncomingMessage, res: MidwareResponse) => void

interface URServer {
    listen(port: number, hostname: string): void;
    use(middleware: MidwareHandler): void;
    addService(method: string, path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    removeService(method: string, path: string): void;
    get(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    post(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    put(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    delete(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    optoin(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
    head(path: string, handler: (req: IncomingMessage, res: Response) => void): void;
}

export function uRestserver(): URServer;
