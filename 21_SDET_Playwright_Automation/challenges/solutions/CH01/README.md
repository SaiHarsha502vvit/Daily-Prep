# CH01 Challenge Solution

This folder contains the solution implementation for Challenge CH01 of the SDET Playwright Automation curriculum.

## Overview

CH01 establishes foundational building blocks used throughout the framework: typed timeouts, API/user domain models, reusable action helpers, and centralized environment configuration.

## File Structure and Purpose

### `constants/timeouts.ts`
Centralizes timeout and polling interval constants using TypeScript enums with numeric underscores for readability.

- **`Timeouts` enum**: Standard wait durations (1s to 5min) for element waits, API retries, and general timeouts
- **`PollIntervals` enum**: Frequency options for polling loops (FAST=100ms, MEDIUM=500ms, SLOW=1000ms)

### `types/api.types.ts`
TypeScript interfaces for API response patterns following REST conventions.

- **`PaginationMeta`**: Metadata for paginated endpoints (page, perPage, total, totalPages)
- **`ApiError`**: Structured error representation with code, message, and optional field
- **`ApiResponse<T>`**: Generic wrapper for API responses with data, optional pagination, and optional errors array

### `types/user.types.ts`
Domain models for OrangeHRM user entities.

- **`UserRole` enum**: Role constants (ADMIN, MANAGER, ESS) matching OrangeHRM's role system
- **`UserStatus` enum**: User account states (ACTIVE, INACTIVE, TERMINATED)
- **`UserData` interface**: Complete user object with id, name components, role, and status

### `utilities/helpers/action.helpers.ts`
Reusable UI automation helpers that wrap Playwright locator actions with consistent logging and timeout handling.

- **`clickElement`**: Waits for visibility, clicks, and optionally logs the action
- **`fillInput`**: Waits for visibility, fills text, and optionally logs the action
- **`ActionOptions`**: Standard interface for action configuration (description, optional timeout)

### `config/env.loader.ts`
Centralized environment configuration loader with validation.

- **`envConfig`**: Frozen configuration object with typed properties
- **`requireEnv`**: Helper that throws if a required env var is missing
- **`optionalEnv`**: Helper for reading optional env vars
- **`boolEnv`**: Helper for parsing boolean env vars (true/1)
- **`numberEnv`**: Helper for parsing numeric env vars with fallback defaults

## Challenge Spec Reference

This solution addresses the requirements from [CH01 Challenge Specification](../../CH01_Core_Infrastructure.md).

## Usage

Import from the solution directory:

```typescript
import { Timeouts, PollIntervals } from '../challenges/solutions/CH01/constants/timeouts';
import { ApiResponse, PaginationMeta } from '../challenges/solutions/CH01/types/api.types';
import { UserData, UserRole, UserStatus } from '../challenges/solutions/CH01/types/user.types';
import { clickElement, fillInput } from '../challenges/solutions/CH01/utilities/helpers/action.helpers';
import { envConfig } from '../challenges/solutions/CH01/config/env.loader';
```