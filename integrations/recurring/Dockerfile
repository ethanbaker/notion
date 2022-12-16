# syntax=docker/dockerfile:1

FROM golang:1.18
ENV GO111MODULE=auto

# Set the working directory for the docker image
WORKDIR /go/src/github.com/ethanbaker/notion/integrations/recurring

# Copy the build information over
COPY . .

# Download the ncesessary Go modules
RUN go mod download && go mod verify

# Build the application to an executable
RUN go build -o /main

# Run the executable
CMD [ "/main" ]

# Commands to build and run:
# docker build --tag notion-recurring .
# docker run -d --name notion-recurring notion-recurring
