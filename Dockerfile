FROM node:18-slim
RUN apt-get update && apt-get install -y curl unzip
RUN curl -L https://github.com/github/codeql-action/releases/latest/download/codeql-bundle-linux64.tar.gz -o codeql-bundle.tar.gz && \
    tar xzf codeql-bundle.tar.gz && \
    rm codeql-bundle.tar.gz && \
    mv codeql /usr/local/bin/ && \
    QLS_FILE=$(find /usr/local/bin/codeql -type f -name javascript-code-scanning.qls) && \
    OUTPUT_DIR=$(dirname $QLS_FILE) && \
    echo '- description: Actions-based security queries for JavaScript and TypeScript \
- queries: . \
- include: \
    tags contain: actions' >> $OUTPUT_DIR/actions-code-scanning.qls

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
RUN npm cache clean --force
ENV NODE_ENV="production"
COPY . .
RUN npm run build
ENV PATH="$PATH:/usr/local/bin/codeql"
CMD [ "npm", "start" ]
