import { Image } from "@napi-rs/canvas";
import { Readable } from "stream";

export type ImageSource = string | URL | Buffer | ArrayBufferLike | Uint8Array | Image | Readable;
