'use strict';

const builder = require("electron-builder");

// Promise is returned
builder.build({
        platform: [builder.Platform.OSX],
            "//": "platform, arch and other properties, see PackagerOptions in the node_modules/electron-builder/out/electron-builder.d.ts",
        devMetadata: {
            "//": "build and other properties, see https://goo.gl/5jVxoO"
        }
    })
    .then(() => {
        // handle result
    })
    .catch((error) => {
        // handle error
    });