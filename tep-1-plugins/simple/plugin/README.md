# TEP1: Simple Plugin

This repository implements the simplest possible Timeleap plugin using
the lowlevel APIs.

## How to run?

First, install the dependencies with:

```bash
yarn
```

Then build the project:

```bash
yarn build
```

Create a `.env` file with appropriate values for the following variables:

```ini
PLUGIN_PRIVATE_KEY=
WORKER_PUBLIC_KEY=
```

Now you can run the project using the following command:

```bash
yarn start
```
