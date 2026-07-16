ifeq ($(OS),Windows_NT)
    EXE=.exe
    RM=rmdir /s /q
else
    EXE=
    RM=rm -rf
endif

.PHONY: frontend backend build test clean

frontend:
	cd frontend && npm install
	cd frontend && npm run build

backend:
	go build -o bin/driftctl$(EXE) ./cmd/driftctl
	go build -o bin/drift-server$(EXE) ./cmd/drift-server

build: frontend backend

test:
	go test ./...

clean:
	$(RM) bin