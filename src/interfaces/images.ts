import { Readable } from "stream";
import { Image } from "@napi-rs/canvas";

export type ImageSource = string | URL | Buffer | ArrayBufferLike | Uint8Array | Image | Readable;
