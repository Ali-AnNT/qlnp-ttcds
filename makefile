VERSION := $(shell head -n 1 version.txt 2>/dev/null | tr -d '[:space:]')
ifeq ($(VERSION),)
VERSION := dev
endif
CERT_PASSWORD := vietinfo@123
SOLUTION := qlnp-ttcds.sln

# ---------- Docker registry ----------
REGISTRY := git.vietinfo.tech:8092/toanhv/qlnp

# ---------- API Docker ----------
api-dev:
	# Build Docker image
	cd ./packages/api && docker build -t $(REGISTRY):latest \
	                  -t $(REGISTRY):$(VERSION) \
	                  --build-arg CERT_PASSWORD=$(CERT_PASSWORD) .
		# Push Docker images
	docker push $(REGISTRY):latest
	docker push $(REGISTRY):$(VERSION)

release:
	cd ./packages/api && docker build -t $(REGISTRY):release \
	                  -t $(REGISTRY):$(VERSION) \
	                  --build-arg CERT_PASSWORD=$(CERT_PASSWORD) .
	docker push $(REGISTRY):release
	docker push $(REGISTRY):$(VERSION)

# ---------- Production build/push ----------
build-prod:
	cd ./packages/api && docker build -t $(REGISTRY):latest \
	                  -t $(REGISTRY):v$(VERSION) \
	                  --build-arg CERT_PASSWORD=$(CERT_PASSWORD) .

push-prod:
	docker push $(REGISTRY):latest
	docker push $(REGISTRY):v$(VERSION)

all: build-prod push-prod

dev: 
	make api-dev
	make web-dev

# ---------- Web build ----------
build-web:
	@echo "==> Building web (production)..."
	cd ./packages/web && pnpm build

build-web-dev:
	@echo "==> Building web (development)..."
	cd ./packages/web && pnpm build:dev

web-dev:
	node scripts/deploy.cjs

# ---------- API IIS deployment ----------
# Publish .NET API for IIS (inprocess hosting via ASP.NET Core Module)
# Output: packages/api/publish/

API_PUBLISH_DIR := packages/api/publish

api-iis-publish:
	@echo "==> Publishing API for IIS hosting..."
	cd packages/api && dotnet publish QLNP.Api.csproj \
		-c Release \
		-o publish \
		--nologo -v minimal \
		/p:UseAppHost=false
	@echo "==> Publish complete: $(API_PUBLISH_DIR)/"

api-iis-deploy: api-iis-publish
	@echo "==> Deploying API to IIS share..."
	node scripts/deploy-api-iis.cjs

# ---------- Tests ----------
test: test-web test-api
	@echo "All tests passed."

test-web:
	@echo "==> Running web tests (Vitest)..."
	cd ./packages/web && pnpm test --run

test-api:
	@echo "==> Building API..."
	cd ./packages/api && dotnet build --nologo -v minimal
	@echo "==> Running API tests (dotnet test)..."
	@if [ -d ./packages/api.Tests ] || [ -d ./packages/api/Tests ]; then \
		dotnet test $(SOLUTION) --nologo --no-build -v minimal; \
	else \
		echo "No test project found for API, skipping dotnet test."; \
	fi

test-watch:
	cd ./packages/web && pnpm test:watch

# ---------- Helpers ----------
clean:
	cd ./packages/api && dotnet clean --nologo -v minimal
	cd ./packages/web && rm -rf node_modules/.vite dist

version:
	@echo $(VERSION)
