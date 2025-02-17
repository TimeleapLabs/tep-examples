# TEP-2 Message Receiver

This is a simple implementation of a Timeleap Message Receiver in TypeScript
that subscribes to the "swiss.timeleap" topic.

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
CLIENT_PRIVATE_KEY=
BROKER_URI=
BROKER_PUBLIC_KEY=
```

Now you can run the project using the following command:

```bash
yarn start
```
