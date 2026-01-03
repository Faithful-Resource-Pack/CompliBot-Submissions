/* eslint-disable @typescript-eslint/no-namespace */

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			readonly CLIENT_TOKEN: string;

			// string array e.g. "[123, 456, 789]"
			readonly DEVELOPERS: string;
			readonly LOG_CHANNEL: string;

			readonly MAINTENANCE: string;
			readonly FETCH_SETTINGS: string;
			readonly DEBUG: string;
			readonly DEV: string;

			readonly GIT_TOKEN: string;

			readonly API_URL: string;
			readonly API_TOKEN: string;
		}
	}
}

export default null;
