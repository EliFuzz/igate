import { init } from "src/server";

init().catch((error) => {
    console.error('Error initializing server:', error);
    process.exit(1);
});
