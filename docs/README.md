# API Documentation

## Overview
This directory contains comprehensive API documentation for the tRPC backend.

## Structure
```
docs/
├── README.md          # This file
└── api/
    ├── auth.md        # Authentication endpoints
    ├── billing.md     # Billing & subscription endpoints
    └── product.md     # Product management endpoints
```

## Usage
Each API file follows a consistent format:
- **Function name** - The tRPC procedure name
- **Summary** - Brief description of what it does
- **Use case** - When/why to use this endpoint
- **Parameters** - Input parameters with types and descriptions
- **Examples** - JSON input/output examples

## Getting Started
1. Start with [Authentication API](./api/auth.md) for user management
2. Check [Billing API](./api/billing.md) for subscription features
3. Review [Product API](./api/product.md) for product operations

## Base URL
```
http://localhost:3000/trpc
```

## Authentication
Most endpoints require authentication via Bearer token:
```
Authorization: Bearer <your-access-token>
```