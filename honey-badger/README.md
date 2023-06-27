# project-flash

> A GitHub App built with [Probot](https://github.com/probot/probot) that Probot app to manage ProjectV2

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t project-flash .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> project-flash
```

## Contributing

If you have suggestions for how project-flash could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2023 Yadhav Jayaraman <57544838+decyjphr@users.noreply.github.com>
