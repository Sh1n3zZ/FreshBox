.PHONY: all build clean test proto docker

# 变量定义
BINARY_NAME=freshbox
DOCKER_IMAGE=freshbox
VERSION=1.0.0
BUILD_DIR=build
PROTO_DIR=internal/core/vision/proto

# Go 相关命令
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod

# Docker 相关命令
DOCKER=docker
DOCKER_COMPOSE=docker-compose

all: test build

build:
	mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) -v .

clean:
	$(GOCLEAN)
	rm -rf $(BUILD_DIR)

test:
	$(GOTEST) -v ./...

proto:
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		$(PROTO_DIR)/*.proto

docker-build:
	$(DOCKER) build -t $(DOCKER_IMAGE):$(VERSION) .

docker-compose-up:
	$(DOCKER_COMPOSE) -f deployments/docker/docker-compose.yml up -d

docker-compose-down:
	$(DOCKER_COMPOSE) -f deployments/docker/docker-compose.yml down

deps:
	$(GOMOD) download
	$(GOMOD) tidy

lint:
	golangci-lint run

run:
	$(GOBUILD) -o $(BUILD_DIR)/$(BINARY_NAME) -v .
	./$(BUILD_DIR)/$(BINARY_NAME)

.DEFAULT_GOAL := all 