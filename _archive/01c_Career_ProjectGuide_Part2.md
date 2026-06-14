> **Career Guide** | See also: [01_Career_TechnoFunctional.md](01_Career_TechnoFunctional.md) | [01b_Career_ProjectGuide_Part1.md](01b_Career_ProjectGuide_Part1.md) | [Index](../00_MASTER_INDEX.md)

---

## Phase 6: Full-Stack Development - Complete Guide

### The Full-Stack Landscape

```
┌─────────────────────────────────────────────────────────────────┐
│                    FULL-STACK ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      FRONTEND                                ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        ││
│  │  │  React  │  │ Angular │  │   Vue   │  │ Svelte  │        ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        ││
│  │                      │                                       ││
│  │              ┌───────▼───────┐                              ││
│  │              │  State Mgmt   │ Redux/Zustand/Pinia          ││
│  │              └───────────────┘                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                     │
│                    HTTP/WebSocket/GraphQL                        │
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────────┐│
│  │                      BACKEND                                 ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        ││
│  │  │ Node.js │  │  Java   │  │ Python  │  │   Go    │        ││
│  │  │ Express │  │ Spring  │  │ FastAPI │  │   Gin   │        ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        ││
│  │                      │                                       ││
│  │              ┌───────▼───────┐                              ││
│  │              │  API Layer    │ REST/GraphQL/gRPC            ││
│  │              └───────────────┘                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                            │                                     │
│  ┌─────────────────────────▼───────────────────────────────────┐│
│  │                    DATA LAYER                                ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        ││
│  │  │PostgreSQL│ │ MongoDB │  │  Redis  │  │ Elastic │        ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Development - React Complete

#### React Project Structure (Production Ready)

```
my-react-app/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.test.tsx
│   │   │   │   ├── Button.styles.ts
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Modal/
│   │   │   └── Table/
│   │   └── layout/
│   │       ├── Header/
│   │       ├── Footer/
│   │       └── Sidebar/
│   ├── pages/                # Page components (routes)
│   │   ├── Home/
│   │   ├── Dashboard/
│   │   ├── Profile/
│   │   └── Settings/
│   ├── features/             # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   └── types/
│   │   ├── users/
│   │   └── orders/
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   ├── useDebounce.ts
│   │   └── useLocalStorage.ts
│   ├── services/             # API services
│   │   ├── api.ts            # Axios instance
│   │   ├── authService.ts
│   │   └── userService.ts
│   ├── store/                # Global state (Redux/Zustand)
│   │   ├── index.ts
│   │   ├── slices/
│   │   └── middleware/
│   ├── utils/                # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   ├── types/                # TypeScript types
│   │   ├── api.types.ts
│   │   ├── user.types.ts
│   │   └── common.types.ts
│   ├── styles/               # Global styles
│   │   ├── globals.css
│   │   ├── variables.css
│   │   └── theme.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── tests/
├── .env.example
├── .eslintrc.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

#### React Patterns - Production Code

```tsx
// ============================================
// 1. CUSTOM HOOK - useFetch with caching
// ============================================
import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const cache = new Map<string, any>();

export function useFetch<T>(
  url: string,
  options?: RequestInit,
): FetchState<T> & { refetch: () => void } {
  const [state, setState] = useState<FetchState<T>>({
    data: cache.get(url) || null,
    loading: !cache.has(url),
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, options);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      cache.set(url, data);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// ============================================
// 2. API SERVICE - Axios with interceptors
// ============================================
import axios, { AxiosInstance, AxiosError } from "axios";

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired - try refresh or logout
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;

// ============================================
// 3. ZUSTAND STORE - Simple state management
// ============================================
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,

        login: (user, token) =>
          set({
            user,
            token,
            isAuthenticated: true,
          }),

        logout: () =>
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          }),

        updateUser: (updates) =>
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          })),
      }),
      { name: "auth-storage" },
    ),
  ),
);

// ============================================
// 4. PROTECTED ROUTE - Auth guard
// ============================================
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// ============================================
// 5. FORM HANDLING - React Hook Form + Zod
// ============================================
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Form component
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post("/auth/login", data);
      useAuthStore.getState().login(response.data.user, response.data.token);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register("email")} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input
          {...register("password")}
          type="password"
          placeholder="Password"
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <label>
        <input {...register("rememberMe")} type="checkbox" />
        Remember me
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

// ============================================
// 6. DATA TABLE - Reusable component
// ============================================
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading,
  onRowClick,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: "asc" | "desc";
  } | null>(null);

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              onClick={() =>
                col.sortable &&
                setSortConfig({
                  key: col.key,
                  direction: sortConfig?.direction === "asc" ? "desc" : "asc",
                })
              }
            >
              {col.header}
              {col.sortable && sortConfig?.key === col.key && (
                <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr key={row.id} onClick={() => onRowClick?.(row)}>
            {columns.map((col) => (
              <td key={String(col.key)}>
                {col.render
                  ? col.render(row[col.key], row)
                  : String(row[col.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Backend Development - Spring Boot Complete

#### Spring Boot Project Structure

```
my-spring-app/
├── src/
│   ├── main/
│   │   ├── java/com/example/app/
│   │   │   ├── config/              # Configuration classes
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── CorsConfig.java
│   │   │   │   └── SwaggerConfig.java
│   │   │   ├── controller/          # REST Controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── UserController.java
│   │   │   │   └── OrderController.java
│   │   │   ├── service/             # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── UserService.java
│   │   │   │   └── impl/
│   │   │   │       └── UserServiceImpl.java
│   │   │   ├── repository/          # Data access
│   │   │   │   ├── UserRepository.java
│   │   │   │   └── OrderRepository.java
│   │   │   ├── model/               # Entities
│   │   │   │   ├── User.java
│   │   │   │   ├── Order.java
│   │   │   │   └── AuditEntity.java
│   │   │   ├── dto/                 # Data Transfer Objects
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   └── CreateUserRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── UserResponse.java
│   │   │   │       └── ApiResponse.java
│   │   │   ├── exception/           # Exception handling
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   └── ValidationException.java
│   │   │   ├── security/            # Security components
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthFilter.java
│   │   │   │   └── UserDetailsServiceImpl.java
│   │   │   ├── mapper/              # Entity-DTO mappers
│   │   │   │   └── UserMapper.java
│   │   │   └── Application.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/        # Flyway migrations
│   │           ├── V1__create_users_table.sql
│   │           └── V2__create_orders_table.sql
│   └── test/
│       └── java/com/example/app/
│           ├── controller/
│           ├── service/
│           └── repository/
├── pom.xml
└── Dockerfile
```

#### Spring Boot Production Code

```java
// ============================================
// 1. ENTITY - User with auditing
// ============================================
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    @Email
    private String email;

    @Column(nullable = false)
    @JsonIgnore
    private String password;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.USER;

    @Column(nullable = false)
    private boolean active = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Order> orders = new ArrayList<>();
}

// ============================================
// 2. DTO - Request/Response objects
// ============================================
// Request DTO with validation
@Data
public class CreateUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[A-Z])(?=.*[0-9]).*$",
        message = "Password must contain uppercase and number"
    )
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;
}

// Response DTO
@Data
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole().name())
            .active(user.isActive())
            .createdAt(user.getCreatedAt())
            .build();
    }
}

// Generic API Response wrapper
@Data
@Builder
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .message(message)
            .data(data)
            .timestamp(LocalDateTime.now())
            .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .message(message)
            .timestamp(LocalDateTime.now())
            .build();
    }
}

// ============================================
// 3. REPOSITORY - Custom queries
// ============================================
@Repository
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.active = true AND u.role = :role")
    List<User> findActiveUsersByRole(@Param("role") UserRole role);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    @Modifying
    @Query("UPDATE User u SET u.active = false WHERE u.id = :id")
    void softDelete(@Param("id") String id);
}

// ============================================
// 4. SERVICE - Business logic
// ============================================
public interface UserService {
    UserResponse createUser(CreateUserRequest request);
    UserResponse getUserById(String id);
    Page<UserResponse> getUsers(int page, int size, String search);
    UserResponse updateUser(String id, UpdateUserRequest request);
    void deleteUser(String id);
}

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email already exists");
        }

        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .role(UserRole.USER)
            .active(true)
            .build();

        User savedUser = userRepository.save(user);

        // Publish event for other services (e.g., send welcome email)
        eventPublisher.publishEvent(new UserCreatedEvent(savedUser));

        log.info("User created successfully with id: {}", savedUser.getId());
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(String id) {
        return userRepository.findById(id)
            .map(UserResponse::fromEntity)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Page<User> users = (search != null && !search.isBlank())
            ? userRepository.searchUsers(search, pageable)
            : userRepository.findAll(pageable);

        return users.map(UserResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.softDelete(id);
        log.info("User soft-deleted: {}", id);
    }
}

// ============================================
// 5. CONTROLLER - REST endpoints
// ============================================
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management APIs")
public class UserController {

    private final UserService userService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new user")
    public ApiResponse<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success("User created successfully",
            userService.createUser(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ApiResponse<UserResponse> getUserById(
            @PathVariable String id) {
        return ApiResponse.success(userService.getUserById(id));
    }

    @GetMapping
    @Operation(summary = "Get all users with pagination")
    public ApiResponse<Page<UserResponse>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        return ApiResponse.success(userService.getUsers(page, size, search));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ApiResponse.success("User updated successfully",
            userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete user")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
    }
}

// ============================================
// 6. EXCEPTION HANDLING - Global handler
// ============================================
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleValidation(ValidationException ex) {
        log.warn("Validation error: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage()));

        return ApiResponse.<Map<String, String>>builder()
            .success(false)
            .message("Validation failed")
            .data(errors)
            .timestamp(LocalDateTime.now())
            .build();
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleAll(Exception ex) {
        log.error("Unexpected error", ex);
        return ApiResponse.error("An unexpected error occurred");
    }
}

// ============================================
// 7. SECURITY - JWT Authentication
// ============================================
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);

        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(getSigningKey(), SignatureAlgorithm.HS512)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(getSigningKey())
            .build()
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = getTokenFromRequest(request);

        if (token != null && tokenProvider.validateToken(token)) {
            String username = tokenProvider.getUsernameFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

// Security Configuration
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### API Design - REST Best Practices

```
REST API DESIGN CHECKLIST:
──────────────────────────

1. URL STRUCTURE
   ✓ Use nouns, not verbs: /users NOT /getUsers
   ✓ Use plural: /users NOT /user
   ✓ Use kebab-case: /user-profiles NOT /userProfiles
   ✓ Hierarchical: /users/{id}/orders/{orderId}
   ✓ Filter via query params: /users?role=admin&active=true

2. HTTP METHODS
   ┌────────────────────────────────────────────────────────────┐
   │ Method   │ Action           │ Success Code  │ Example     │
   ├──────────┼──────────────────┼───────────────┼─────────────┤
   │ GET      │ Read             │ 200 OK        │ GET /users  │
   │ POST     │ Create           │ 201 Created   │ POST /users │
   │ PUT      │ Full Update      │ 200 OK        │ PUT /users/1│
   │ PATCH    │ Partial Update   │ 200 OK        │ PATCH /users/1│
   │ DELETE   │ Delete           │ 204 No Content│ DELETE /users/1│
   └────────────────────────────────────────────────────────────┘

3. STATUS CODES
   2xx - Success
       200 OK - General success
       201 Created - Resource created
       204 No Content - Success, no body (DELETE)

   4xx - Client Error
       400 Bad Request - Validation error
       401 Unauthorized - Not authenticated
       403 Forbidden - Not authorized
       404 Not Found - Resource doesn't exist
       409 Conflict - Duplicate resource
       422 Unprocessable Entity - Semantic error

   5xx - Server Error
       500 Internal Server Error - Unexpected error
       502 Bad Gateway - Upstream service error
       503 Service Unavailable - Maintenance

4. PAGINATION
   Request:  GET /users?page=0&size=20&sort=createdAt,desc
   Response:
   {
     "content": [...],
     "page": 0,
     "size": 20,
     "totalElements": 150,
     "totalPages": 8,
     "last": false
   }

5. VERSIONING
   URL Path:     /api/v1/users (Recommended)
   Header:       Accept: application/vnd.api.v1+json
   Query Param:  /api/users?version=1

6. ERROR RESPONSE FORMAT
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Validation failed",
       "details": [
         { "field": "email", "message": "Invalid email format" },
         { "field": "password", "message": "Too short" }
       ]
     },
     "timestamp": "2024-01-15T10:30:00Z",
     "path": "/api/v1/users"
   }
```

### WebSocket - Real-time Communication

```java
// Spring WebSocket Configuration
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker for subscriptions
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages from client to server
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific messages
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOrigins("http://localhost:3000")
            .withSockJS();
    }
}

// WebSocket Controller
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    // Broadcast to all subscribers
    @MessageMapping("/chat.send")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        return message;
    }

    // Send to specific user
    @MessageMapping("/chat.private")
    public void sendPrivateMessage(PrivateMessage message, Principal principal) {
        messagingTemplate.convertAndSendToUser(
            message.getRecipient(),
            "/queue/private",
            message
        );
    }

    // Notify user joined
    @MessageMapping("/chat.join")
    @SendTo("/topic/users")
    public UserJoinedEvent userJoined(UserJoinedEvent event) {
        return event;
    }
}

// React WebSocket Client
const useWebSocket = (url: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(url),
      onConnect: () => {
        // Subscribe to public channel
        client.subscribe('/topic/messages', (message) => {
          const chatMessage = JSON.parse(message.body);
          setMessages(prev => [...prev, chatMessage]);
        });

        // Subscribe to private channel
        client.subscribe('/user/queue/private', (message) => {
          const privateMessage = JSON.parse(message.body);
          setMessages(prev => [...prev, privateMessage]);
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => client.deactivate();
  }, [url]);

  const sendMessage = (content: string) => {
    stompClient.current?.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ content }),
    });
  };

  return { messages, sendMessage };
};
```

### Docker - Containerization

```dockerfile
# ============================================
# MULTI-STAGE DOCKERFILE - Spring Boot
# ============================================

# Stage 1: Build
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw pom.xml ./
COPY .mvn .mvn

# Download dependencies (cached if pom.xml unchanged)
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src

# Build application
RUN ./mvnw package -DskipTests

# Extract layers for better caching
RUN java -Djarmode=layertools -jar target/*.jar extract

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy layers from builder
COPY --from=builder /app/dependencies/ ./
COPY --from=builder /app/spring-boot-loader/ ./
COPY --from=builder /app/snapshot-dependencies/ ./
COPY --from=builder /app/application/ ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]


# ============================================
# DOCKER COMPOSE - Full Stack
# ============================================
# docker-compose.yml

version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8080
    depends_on:
      - backend

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/appdb
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD}
      - SPRING_REDIS_HOST=redis
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  # Database
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Nginx Reverse Proxy (Production)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
# nginx/nginx.conf - Production Configuration

events {
    worker_connections 1024;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # Upstream servers
    upstream backend {
        server backend:8080;
        keepalive 32;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name example.com www.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name example.com www.example.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Frontend (React app)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn 10;

            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 3600s;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            proxy_pass http://frontend;
        }
    }
}
```

---

## 🔬 Spring Boot Deep Internals - How Your Code Runs

### Spring Boot Application Startup

```
WHAT HAPPENS WHEN YOU RUN SpringApplication.run():
═══════════════════════════════════════════════════

@SpringBootApplication
public class MyApp {
    public static void main(String[] args) {
        SpringApplication.run(MyApp.class, args);  // <-- What happens here?
    }
}

┌─────────────────────────────────────────────────────────────────┐
│              SPRING BOOT STARTUP SEQUENCE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CREATE SpringApplication OBJECT                             │
│  ─────────────────────────────────                              │
│  • Detect web application type (SERVLET, REACTIVE, NONE)       │
│  • Load ApplicationContextInitializers                         │
│  • Load ApplicationListeners                                    │
│  • Detect main application class                                │
│                                                                  │
│                                                                  │
│  2. RUN METHOD EXECUTION                                        │
│  ───────────────────────                                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ a) Create & Configure Environment                         │  │
│  │    • Load application.properties / application.yml       │  │
│  │    • Load environment variables                          │  │
│  │    • Load command line arguments                         │  │
│  │    • Profile activation (dev, prod, etc.)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ b) Print Banner                                           │  │
│  │      ____          _            ____              _      │  │
│  │     / ___| _ __  _(_)_ __   __ | __ )  ___   ___ | |_    │  │
│  │     \___ \| '_ \| | | '_ \ / _`|  _ \ / _ \ / _ \| __|   │  │
│  │      ___) | |_) | | | | | | (_| | |_) | (_) | (_) | |_    │  │
│  │     |____/| .__/|_|_|_| |_|\__, |____/ \___/ \___/ \__|   │  │
│  │           |_|              |___/                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ c) Create ApplicationContext                              │  │
│  │                                                           │  │
│  │    Web App → AnnotationConfigServletWebServerContext     │  │
│  │                                                           │  │
│  │    This is the IoC Container that will hold all beans    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ d) COMPONENT SCANNING (Most Important!)                   │  │
│  │                                                           │  │
│  │    @SpringBootApplication includes @ComponentScan        │  │
│  │                                                           │  │
│  │    Scans packages for:                                   │  │
│  │    • @Component                                          │  │
│  │    • @Service                                            │  │
│  │    • @Repository                                         │  │
│  │    • @Controller / @RestController                       │  │
│  │    • @Configuration                                      │  │
│  │                                                           │  │
│  │    For each found class:                                 │  │
│  │    → Create bean definition                              │  │
│  │    → Check @Autowired dependencies                       │  │
│  │    → Add to bean registry                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ e) AUTO-CONFIGURATION                                     │  │
│  │                                                           │  │
│  │    Spring Boot reads: META-INF/spring.factories          │  │
│  │                                                           │  │
│  │    Conditional auto-configs:                             │  │
│  │    @ConditionalOnClass(DataSource.class)                │  │
│  │    → If H2/MySQL driver present → Configure DataSource   │  │
│  │                                                           │  │
│  │    @ConditionalOnMissingBean                             │  │
│  │    → Only create if user hasn't defined their own       │  │
│  │                                                           │  │
│  │    Examples:                                              │  │
│  │    • DataSourceAutoConfiguration                         │  │
│  │    • JpaAutoConfiguration                                │  │
│  │    • WebMvcAutoConfiguration                             │  │
│  │    • TomcatAutoConfiguration                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ f) BEAN INSTANTIATION (Dependency Injection)              │  │
│  │                                                           │  │
│  │    Order:                                                │  │
│  │    1. Instantiate beans with no dependencies             │  │
│  │    2. Inject dependencies into beans that need them      │  │
│  │    3. Call @PostConstruct methods                        │  │
│  │    4. Call InitializingBean.afterPropertiesSet()        │  │
│  │                                                           │  │
│  │    Example:                                               │  │
│  │    @Service                                              │  │
│  │    public class UserService {                            │  │
│  │        @Autowired  // Spring injects this!              │  │
│  │        private UserRepository repo;                      │  │
│  │    }                                                      │  │
│  │                                                           │  │
│  │    Spring:                                                │  │
│  │    1. Create UserRepository instance                     │  │
│  │    2. Create UserService instance                        │  │
│  │    3. Inject repo into UserService                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ g) START EMBEDDED SERVER                                  │  │
│  │                                                           │  │
│  │    TomcatWebServer:                                      │  │
│  │    • Create Tomcat instance                              │  │
│  │    • Configure connectors (port 8080)                    │  │
│  │    • Register DispatcherServlet                          │  │
│  │    • Start listening for connections                     │  │
│  │                                                           │  │
│  │    Log: Tomcat started on port(s): 8080 (http)          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         │                                       │
│                         ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ h) APPLICATION READY                                      │  │
│  │                                                           │  │
│  │    Publish ApplicationReadyEvent                         │  │
│  │    Log: Started MyApp in 2.345 seconds                   │  │
│  │                                                           │  │
│  │    Your app is now ready to receive requests!            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### HTTP Request Flow Through Spring MVC

```
COMPLETE REQUEST LIFECYCLE IN SPRING BOOT:
═════════════════════════════════════════

Client sends: GET /api/users/123

┌─────────────────────────────────────────────────────────────────┐
│              HTTP REQUEST JOURNEY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: TOMCAT RECEIVES REQUEST                                │
│  ───────────────────────────────                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      TOMCAT                              │   │
│  │                                                          │   │
│  │  Thread Pool: [T1] [T2] [T3] ... [T200]                 │   │
│  │                                                          │   │
│  │  New request arrives:                                   │   │
│  │  → Assign thread T1 to handle it                        │   │
│  │  → T1 will process entire request                       │   │
│  │                                                          │   │
│  │  socket.read() → Parse HTTP:                            │   │
│  │  • Method: GET                                          │   │
│  │  • Path: /api/users/123                                 │   │
│  │  • Headers: Accept, Content-Type, Authorization...      │   │
│  │                                                          │   │
│  │  Create:                                                 │   │
│  │  • HttpServletRequest object                            │   │
│  │  • HttpServletResponse object                           │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 2: FILTER CHAIN                                          │
│  ────────────────────                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   FILTER CHAIN                           │   │
│  │                                                          │   │
│  │  Request passes through filters (in order):             │   │
│  │                                                          │   │
│  │  1. CharacterEncodingFilter                             │   │
│  │     → Set UTF-8 encoding                                │   │
│  │                                                          │   │
│  │  2. CorsFilter (if configured)                          │   │
│  │     → Check CORS headers                                │   │
│  │                                                          │   │
│  │  3. SecurityFilterChain (Spring Security)               │   │
│  │     → Authentication                                    │   │
│  │     → Authorization                                      │   │
│  │     → CSRF check                                        │   │
│  │     → Session management                                │   │
│  │                                                          │   │
│  │  4. Custom filters...                                   │   │
│  │                                                          │   │
│  │  chain.doFilter(request, response);                     │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 3: DISPATCHER SERVLET                                    │
│  ──────────────────────────                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                DISPATCHER SERVLET                        │   │
│  │            (Front Controller Pattern)                    │   │
│  │                                                          │   │
│  │  a) HANDLER MAPPING                                     │   │
│  │     "Which controller handles /api/users/123?"          │   │
│  │                                                          │   │
│  │     Check RequestMappingHandlerMapping:                 │   │
│  │     • GET /api/users/{id} → UserController.getUser()    │   │
│  │                                                          │   │
│  │     Found: UserController, method getUser               │   │
│  │                                                          │   │
│  │  b) BUILD HANDLER EXECUTION CHAIN                       │   │
│  │     • HandlerMethod (the controller method)             │   │
│  │     • Interceptors (pre/post processing)                │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 4: INTERCEPTORS (preHandle)                              │
│  ────────────────────────────────                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  INTERCEPTORS                            │   │
│  │                                                          │   │
│  │  LoggingInterceptor.preHandle()                         │   │
│  │  → Log request details                                  │   │
│  │                                                          │   │
│  │  AuthInterceptor.preHandle()                            │   │
│  │  → Verify JWT token, set user in context                │   │
│  │                                                          │   │
│  │  RateLimitInterceptor.preHandle()                       │   │
│  │  → Check rate limit, reject if exceeded                 │   │
│  │                                                          │   │
│  │  return true; → Continue to controller                  │   │
│  │  return false; → Stop, send response                    │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 5: HANDLER ADAPTER                                       │
│  ───────────────────────                                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             HANDLER ADAPTER                              │   │
│  │    (RequestMappingHandlerAdapter)                        │   │
│  │                                                          │   │
│  │  ARGUMENT RESOLUTION:                                   │   │
│  │  ─────────────────────                                  │   │
│  │                                                          │   │
│  │  @GetMapping("/api/users/{id}")                         │   │
│  │  public User getUser(@PathVariable Long id,             │   │
│  │                      @RequestHeader("Auth") String token│   │
│  │                      HttpServletRequest request) {...}  │   │
│  │                                                          │   │
│  │  ArgumentResolvers:                                     │   │
│  │  • PathVariableMethodArgumentResolver                   │   │
│  │    → Extract "123" from URL, convert to Long            │   │
│  │  • RequestHeaderMethodArgumentResolver                  │   │
│  │    → Extract "Auth" header value                        │   │
│  │  • ServletRequestMethodArgumentResolver                 │   │
│  │    → Inject HttpServletRequest                          │   │
│  │                                                          │   │
│  │  Now invoke: controller.getUser(123L, "token", request) │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 6: YOUR CONTROLLER CODE RUNS                             │
│  ─────────────────────────────────                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                YOUR CONTROLLER                           │   │
│  │                                                          │   │
│  │  @RestController                                        │   │
│  │  @RequestMapping("/api/users")                          │   │
│  │  public class UserController {                          │   │
│  │                                                          │   │
│  │      @Autowired                                         │   │
│  │      private UserService userService;                   │   │
│  │                                                          │   │
│  │      @GetMapping("/{id}")                               │   │
│  │      public User getUser(@PathVariable Long id) {       │   │
│  │          return userService.findById(id);               │   │
│  │      }                                                   │   │
│  │  }                                                       │   │
│  │                                                          │   │
│  │  Executes:                                               │   │
│  │  1. Call userService.findById(123)                      │   │
│  │  2. Service calls userRepository.findById(123)          │   │
│  │  3. Repository generates SQL, queries database          │   │
│  │  4. Return User object                                   │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 7: RETURN VALUE HANDLING                                 │
│  ─────────────────────────────                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            RETURN VALUE HANDLERS                         │   │
│  │                                                          │   │
│  │  Controller returns: User object                        │   │
│  │                                                          │   │
│  │  @RestController includes @ResponseBody                 │   │
│  │  → Use HttpMessageConverter                             │   │
│  │                                                          │   │
│  │  Content negotiation (Accept header):                   │   │
│  │  • Accept: application/json → MappingJackson2Converter │   │
│  │  • Accept: application/xml → Jaxb2Converter            │   │
│  │                                                          │   │
│  │  Jackson serializes User to JSON:                       │   │
│  │  {                                                       │   │
│  │    "id": 123,                                           │   │
│  │    "name": "John",                                      │   │
│  │    "email": "john@example.com"                          │   │
│  │  }                                                       │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 8: INTERCEPTORS (postHandle)                             │
│  ─────────────────────────────────                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  LoggingInterceptor.postHandle()                        │   │
│  │  → Log response status, timing                          │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  STEP 9: RESPONSE SENT                                         │
│  ─────────────────────                                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  HTTP/1.1 200 OK                                        │   │
│  │  Content-Type: application/json                         │   │
│  │  Content-Length: 67                                     │   │
│  │                                                          │   │
│  │  {"id":123,"name":"John","email":"john@example.com"}    │   │
│  │                                                          │   │
│  │  → Written to socket                                    │   │
│  │  → Thread T1 released back to pool                      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TOTAL TIME: ~50ms                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### JPA/Hibernate Query Execution

```
WHAT HAPPENS WHEN YOU CALL repository.findById():
═════════════════════════════════════════════════

Code: User user = userRepository.findById(123L);

┌─────────────────────────────────────────────────────────────────┐
│              JPA QUERY EXECUTION                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SPRING DATA JPA                                             │
│  ───────────────────                                            │
│                                                                  │
│  UserRepository extends JpaRepository<User, Long>               │
│                                                                  │
│  Spring Data JPA creates proxy at startup:                     │
│  → Generates implementation for findById()                      │
│  → Uses JPA EntityManager internally                           │
│                                                                  │
│                                                                  │
│  2. ENTITY MANAGER                                              │
│  ────────────────                                               │
│                                                                  │
│  entityManager.find(User.class, 123L);                         │
│                                                                  │
│  First, check FIRST-LEVEL CACHE (Persistence Context):         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PERSISTENCE CONTEXT                         │   │
│  │                  (Session)                               │   │
│  │                                                          │   │
│  │  Cache: { User#123 → null } // Not found                │   │
│  │                                                          │   │
│  │  If found: return cached entity (no DB query!)          │   │
│  │  If not: continue to second-level cache or DB           │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  3. SECOND-LEVEL CACHE (Optional, e.g., EhCache)               │
│  ───────────────────────────────────────────────                │
│                                                                  │
│  @Cacheable on entity:                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              SECOND-LEVEL CACHE                          │   │
│  │                                                          │   │
│  │  Region: "users"                                        │   │
│  │  Key: 123                                                │   │
│  │  Value: null // Not cached                              │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  4. HIBERNATE GENERATES SQL                                     │
│  ──────────────────────────                                     │
│                                                                  │
│  Hibernate: select u.id, u.name, u.email, u.created_at         │
│             from users u                                        │
│             where u.id = ?                                      │
│                                                                  │
│                                                                  │
│  5. JDBC LAYER                                                  │
│  ────────────                                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   HIKARI CP                              │   │
│  │              (Connection Pool)                           │   │
│  │                                                          │   │
│  │  pool.getConnection();                                  │   │
│  │  → Return available connection from pool                │   │
│  │                                                          │   │
│  │  PreparedStatement ps = conn.prepareStatement(sql);     │   │
│  │  ps.setLong(1, 123);                                    │   │
│  │  ResultSet rs = ps.executeQuery();                      │   │
│  │                                                          │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  6. DATABASE EXECUTION                                          │
│  ─────────────────────                                          │
│                                                                  │
│  (As explained in Database Internals section)                   │
│  → Parse → Optimize → Execute → Return rows                    │
│                                                                  │
│                                                                  │
│  7. RESULT MAPPING                                              │
│  ────────────────                                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ResultSet row:                                         │   │
│  │  | id  | name  | email            | created_at    |     │   │
│  │  | 123 | John  | john@example.com | 2024-01-15    |     │   │
│  │                                                          │   │
│  │  Hibernate creates User object:                         │   │
│  │  User user = new User();                                │   │
│  │  user.setId(rs.getLong("id"));                          │   │
│  │  user.setName(rs.getString("name"));                    │   │
│  │  user.setEmail(rs.getString("email"));                  │   │
│  │  ...                                                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  8. CACHE POPULATION                                            │
│  ───────────────────                                            │
│                                                                  │
│  • Add to first-level cache (Persistence Context)              │
│  • Add to second-level cache (if enabled)                      │
│                                                                  │
│  Next call to findById(123) will return cached entity!         │
│                                                                  │
│                                                                  │
│  9. RETURN ENTITY                                               │
│  ───────────────                                                │
│                                                                  │
│  return user; // Managed entity in Persistence Context         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


N+1 PROBLEM EXPLAINED:
─────────────────────

// BAD: N+1 queries
List<User> users = userRepository.findAll();  // 1 query
for (User user : users) {
    user.getOrders().size();  // N queries (one per user!)
}

Total queries: 1 + N (if 100 users = 101 queries!)

// GOOD: Eager fetch with JOIN
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();  // 1 query only!
```

### Transaction Management Internals

```
@TRANSACTIONAL - HOW IT WORKS:
═════════════════════════════

@Service
public class UserService {

    @Transactional
    public void transferMoney(Long fromId, Long toId, BigDecimal amount) {
        Account from = accountRepo.findById(fromId);
        Account to = accountRepo.findById(toId);

        from.setBalance(from.getBalance().subtract(amount));
        to.setBalance(to.getBalance().add(amount));

        // No explicit save needed - dirty checking!
    }
}

┌─────────────────────────────────────────────────────────────────┐
│              @TRANSACTIONAL EXECUTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SPRING AOP PROXY:                                              │
│  ─────────────────                                              │
│                                                                  │
│  At startup, Spring creates proxy around UserService:          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PROXY                                  │   │
│  │                                                          │   │
│  │  public void transferMoney(...) {                       │   │
│  │      // Before advice                                   │   │
│  │      TransactionStatus tx = txManager.getTransaction(); │   │
│  │                                                          │   │
│  │      try {                                               │   │
│  │          // Call actual method                          │   │
│  │          target.transferMoney(fromId, toId, amount);    │   │
│  │                                                          │   │
│  │          // After returning advice                      │   │
│  │          txManager.commit(tx);                          │   │
│  │                                                          │   │
│  │      } catch (Exception e) {                            │   │
│  │          // After throwing advice                       │   │
│  │          txManager.rollback(tx);                        │   │
│  │          throw e;                                        │   │
│  │      }                                                   │   │
│  │  }                                                       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  DIRTY CHECKING (How save happens without save()):             │
│  ─────────────────────────────────────────────────             │
│                                                                  │
│  When transaction starts:                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Persistence Context tracks:                             │   │
│  │                                                          │   │
│  │  Entity        Original Values       Current Values     │   │
│  │  ────────────────────────────────────────────────────   │   │
│  │  Account#1     balance: 1000          balance: 900      │   │
│  │  Account#2     balance: 500           balance: 600      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  At commit time (flush):                                        │
│  • Compare original vs current                                 │
│  • Generate UPDATE statements for changed entities             │
│                                                                  │
│  UPDATE accounts SET balance = 900 WHERE id = 1;               │
│  UPDATE accounts SET balance = 600 WHERE id = 2;               │
│                                                                  │
│                                                                  │
│  PROPAGATION LEVELS:                                            │
│  ──────────────────                                             │
│                                                                  │
│  @Transactional(propagation = Propagation.REQUIRED)  // Default│
│  → Join existing tx or create new one                          │
│                                                                  │
│  @Transactional(propagation = Propagation.REQUIRES_NEW)        │
│  → Always create new tx, suspend existing                      │
│                                                                  │
│  @Transactional(propagation = Propagation.NESTED)              │
│  → Create savepoint within existing tx                         │
│                                                                  │
│                                                                  │
│  ISOLATION LEVELS:                                              │
│  ────────────────                                               │
│                                                                  │
│  @Transactional(isolation = Isolation.READ_COMMITTED)          │
│  → Can't read uncommitted changes from other tx                │
│                                                                  │
│  @Transactional(isolation = Isolation.REPEATABLE_READ)         │
│  → Same query returns same results within tx                   │
│                                                                  │
│  @Transactional(isolation = Isolation.SERIALIZABLE)            │
│  → Fully isolated (slowest, safest)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

_Stage 3 Complete! Ready for Stage 4: DevOps & Networking Deep Dive_

---

## Phase 7: DevOps - Complete Guide

### DevOps Culture & Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVOPS INFINITY LOOP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│            PLAN → CODE → BUILD → TEST                            │
│           ↗                          ↘                           │
│       MONITOR                          RELEASE                   │
│           ↖                          ↙                           │
│            OPERATE ← DEPLOY ← RELEASE                            │
│                                                                  │
│  DEV SIDE (Left):              OPS SIDE (Right):                │
│  ├── Plan                      ├── Release                      │
│  ├── Code                      ├── Deploy                       │
│  ├── Build                     ├── Operate                      │
│  └── Test                      └── Monitor                      │
│                                                                  │
│  KEY PRACTICES:                                                  │
│  ├── Continuous Integration (CI)                                │
│  ├── Continuous Delivery/Deployment (CD)                        │
│  ├── Infrastructure as Code (IaC)                               │
│  ├── Monitoring & Observability                                 │
│  ├── Microservices Architecture                                 │
│  └── Automated Testing                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes - Complete Guide

#### Kubernetes Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 KUBERNETES ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────── CONTROL PLANE ─────────────────────┐    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │ API Server   │  │  Scheduler   │  │  Controller  │  │    │
│  │  │              │  │              │  │  Manager     │  │    │
│  │  │ kubectl →    │  │ Pod to Node  │  │ Desired vs   │  │    │
│  │  │ REST API     │  │ Assignment   │  │ Actual State │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  │                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐                    │    │
│  │  │    etcd      │  │ Cloud        │                    │    │
│  │  │              │  │ Controller   │                    │    │
│  │  │ Key-Value    │  │ Manager      │                    │    │
│  │  │ Store        │  │ (Optional)   │                    │    │
│  │  └──────────────┘  └──────────────┘                    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────┐      │
│  │                    WORKER NODES                        │      │
│  │                           │                            │      │
│  │  ┌────────────────────────┼────────────────────────┐  │      │
│  │  │         NODE 1         │         NODE 2         │  │      │
│  │  │  ┌─────────────────┐   │   ┌─────────────────┐  │  │      │
│  │  │  │     Kubelet     │   │   │     Kubelet     │  │  │      │
│  │  │  └─────────────────┘   │   └─────────────────┘  │  │      │
│  │  │  ┌─────────────────┐   │   ┌─────────────────┐  │  │      │
│  │  │  │   Kube-Proxy    │   │   │   Kube-Proxy    │  │  │      │
│  │  │  └─────────────────┘   │   └─────────────────┘  │  │      │
│  │  │  ┌─────┐ ┌─────┐      │   ┌─────┐ ┌─────┐     │  │      │
│  │  │  │ Pod │ │ Pod │      │   │ Pod │ │ Pod │     │  │      │
│  │  │  └─────┘ └─────┘      │   └─────┘ └─────┘     │  │      │
│  │  └────────────────────────┴────────────────────────┘  │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Kubernetes Objects

```yaml
# ============================================
# 1. DEPLOYMENT - Manages ReplicaSets/Pods
# ============================================
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: production
  labels:
    app: backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1 # Max pods above desired
      maxUnavailable: 0 # Zero downtime
  template:
    metadata:
      labels:
        app: backend
        version: v1
    spec:
      containers:
        - name: backend
          image: myregistry/backend:v1.2.3
          ports:
            - containerPort: 8080

          # Resource limits
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"

          # Environment variables
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: "production"
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: password

          # Health checks
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10

          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5

          # Volume mounts
          volumeMounts:
            - name: config-volume
              mountPath: /app/config
              readOnly: true

      volumes:
        - name: config-volume
          configMap:
            name: backend-config

---
# ============================================
# 2. SERVICE - Network access to Pods
# ============================================
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: production
spec:
  type: ClusterIP # Internal only
  selector:
    app: backend
  ports:
    - name: http
      port: 80
      targetPort: 8080

---
# ============================================
# 3. INGRESS - External HTTP access
# ============================================
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls-secret
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: backend-service
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend-service
                port:
                  number: 80

---
# ============================================
# 4. CONFIGMAP - Configuration data
# ============================================
apiVersion: v1
kind: ConfigMap
metadata:
  name: backend-config
  namespace: production
data:
  application.yml: |
    server:
      port: 8080
    logging:
      level:
        root: INFO
        com.example: DEBUG

---
# ============================================
# 5. SECRET - Sensitive data
# ============================================
apiVersion: v1
kind: Secret
metadata:
  name: db-secrets
  namespace: production
type: Opaque
data:
  username: YWRtaW4= # base64 encoded
  password: cGFzc3dvcmQ=

---
# ============================================
# 6. HORIZONTAL POD AUTOSCALER (HPA)
# ============================================
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300 # Wait 5 min before scaling down
    scaleUp:
      stabilizationWindowSeconds: 60

---
# ============================================
# 7. PERSISTENT VOLUME CLAIM
# ============================================
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 50Gi

---
# ============================================
# 8. STATEFULSET - For databases
# ============================================
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: password
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: gp3
        resources:
          requests:
            storage: 50Gi
```

#### Helm - Kubernetes Package Manager

```yaml
# Chart.yaml - Helm chart definition
apiVersion: v2
name: my-app
description: A Helm chart for My Application
type: application
version: 1.0.0
appVersion: "1.2.3"
dependencies:
  - name: postgresql
    version: 12.1.0
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled

---
# values.yaml - Default configuration
replicaCount: 3

image:
  repository: myregistry/backend
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.example.com

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilization: 70

postgresql:
  enabled: true
  auth:
    username: app
    password: ""  # Set via --set
    database: appdb

---
# templates/deployment.yaml - Templated deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - containerPort: {{ .Values.service.targetPort }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
```

```bash
# Helm Commands Cheatsheet

# Add repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search charts
helm search repo postgresql

# Install chart
helm install my-release ./my-app \
  --namespace production \
  --create-namespace \
  --set postgresql.auth.password=secretpass \
  --values custom-values.yaml

# Upgrade release
helm upgrade my-release ./my-app \
  --namespace production \
  --set image.tag=v1.3.0

# Rollback
helm rollback my-release 1  # Rollback to revision 1

# List releases
helm list -n production

# Uninstall
helm uninstall my-release -n production

# Template locally (debug)
helm template my-release ./my-app --debug
```

### GitOps with ArgoCD

```yaml
# ArgoCD Application
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/myorg/my-app-manifests.git
    targetRevision: main
    path: kubernetes/production

    # For Helm charts
    helm:
      valueFiles:
        - values-production.yaml
      parameters:
        - name: image.tag
          value: v1.2.3

  destination:
    server: https://kubernetes.default.svc
    namespace: production

  syncPolicy:
    automated:
      prune: true # Delete resources not in Git
      selfHeal: true # Revert manual changes
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m

---
# ArgoCD Project
apiVersion: argoproj.io/v1alpha1
kind: AppProject
metadata:
  name: production
  namespace: argocd
spec:
  description: Production applications
  sourceRepos:
    - "https://github.com/myorg/*"
  destinations:
    - namespace: production
      server: https://kubernetes.default.svc
  clusterResourceWhitelist:
    - group: ""
      kind: Namespace
  namespaceResourceWhitelist:
    - group: "*"
      kind: "*"
```

```
GITOPS WORKFLOW:
────────────────

1. Developer pushes code to app repo
2. CI pipeline builds & pushes Docker image
3. CI updates image tag in GitOps repo
4. ArgoCD detects change in GitOps repo
5. ArgoCD syncs Kubernetes cluster
6. Application deployed automatically

┌────────────┐     ┌────────────┐     ┌────────────┐
│   Code     │     │   Build    │     │  GitOps    │
│   Repo     │────►│   CI/CD    │────►│   Repo     │
└────────────┘     └────────────┘     └────────────┘
                                            │
                                            │ Watches
                                            ▼
                                      ┌────────────┐
                                      │   ArgoCD   │
                                      └────────────┘
                                            │
                                            │ Syncs
                                            ▼
                                      ┌────────────┐
                                      │ Kubernetes │
                                      │  Cluster   │
                                      └────────────┘
```

---

## Phase 8: Networking Fundamentals

### OSI Model & TCP/IP

```
┌─────────────────────────────────────────────────────────────────┐
│                    OSI MODEL vs TCP/IP                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  OSI Model              TCP/IP Model     Protocols              │
│  ─────────              ───────────      ─────────              │
│                                                                  │
│  ┌───────────────┐                                              │
│  │ 7. Application │     ┌─────────────┐  HTTP, HTTPS, FTP,     │
│  ├───────────────┤      │ Application │  SMTP, DNS, SSH,       │
│  │ 6. Presentation│     │             │  WebSocket             │
│  ├───────────────┤      └─────────────┘                        │
│  │ 5. Session    │                                              │
│  ├───────────────┤      ┌─────────────┐                        │
│  │ 4. Transport  │      │  Transport  │  TCP, UDP              │
│  ├───────────────┤      └─────────────┘                        │
│  │ 3. Network    │      ┌─────────────┐  IP, ICMP, ARP         │
│  ├───────────────┤      │  Internet   │                        │
│  │ 2. Data Link  │      └─────────────┘                        │
│  ├───────────────┤      ┌─────────────┐  Ethernet, Wi-Fi       │
│  │ 1. Physical   │      │   Network   │                        │
│  └───────────────┘      │   Access    │                        │
│                         └─────────────┘                        │
│                                                                  │
│  DATA FLOW:                                                      │
│  ─────────                                                       │
│  Application Data                                                │
│       ↓ Add Header                                              │
│  [TCP Header | Data]                                            │
│       ↓ Add Header                                              │
│  [IP Header | TCP Header | Data]                                │
│       ↓ Add Header + Trailer                                    │
│  [Ethernet | IP | TCP | Data | FCS]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### TCP vs UDP

```
┌─────────────────────────────────────────────────────────────────┐
│                      TCP vs UDP                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Feature              TCP                    UDP                 │
│  ───────              ───                    ───                 │
│  Connection           Connection-oriented    Connectionless     │
│  Reliability          Guaranteed delivery    Best effort        │
│  Ordering             Ordered delivery       No ordering        │
│  Flow Control         Yes (sliding window)   No                 │
│  Error Checking       Checksum + ACK         Checksum only      │
│  Speed                Slower                 Faster             │
│  Header Size          20-60 bytes            8 bytes            │
│  Use Cases            Web, Email, File       Video, Gaming,     │
│                       Transfer               DNS, VoIP          │
│                                                                  │
│  TCP 3-WAY HANDSHAKE:                                           │
│  ───────────────────                                            │
│  Client              Server                                      │
│    │                   │                                         │
│    │──── SYN ─────────►│  "Can we connect?"                     │
│    │                   │                                         │
│    │◄─── SYN-ACK ─────│  "Yes, let's connect"                   │
│    │                   │                                         │
│    │──── ACK ─────────►│  "Great, connected!"                   │
│    │                   │                                         │
│                                                                  │
│  TCP CONNECTION CLOSE (4-WAY):                                  │
│  ────────────────────────────                                   │
│  Client              Server                                      │
│    │──── FIN ─────────►│                                        │
│    │◄─── ACK ─────────│                                        │
│    │◄─── FIN ─────────│                                        │
│    │──── ACK ─────────►│                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### DNS - How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    DNS RESOLUTION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User types: www.example.com                                    │
│                                                                  │
│  ┌──────────┐                                                   │
│  │ Browser  │ 1. Check browser cache                            │
│  └────┬─────┘                                                   │
│       │ Not found                                               │
│  ┌────▼─────┐                                                   │
│  │   OS     │ 2. Check OS cache (/etc/hosts)                    │
│  └────┬─────┘                                                   │
│       │ Not found                                               │
│  ┌────▼─────────────┐                                           │
│  │ Local DNS        │ 3. Query local DNS (ISP/Router)           │
│  │ Resolver         │                                           │
│  └────┬─────────────┘                                           │
│       │ Not in cache                                            │
│  ┌────▼─────────────┐                                           │
│  │ Root DNS         │ 4. Query root server                      │
│  │ Server           │    "Who handles .com?"                    │
│  └────┬─────────────┘                                           │
│       │ Returns TLD server                                      │
│  ┌────▼─────────────┐                                           │
│  │ TLD DNS Server   │ 5. Query .com TLD server                  │
│  │ (.com)           │    "Who handles example.com?"             │
│  └────┬─────────────┘                                           │
│       │ Returns authoritative NS                                │
│  ┌────▼─────────────┐                                           │
│  │ Authoritative    │ 6. Query authoritative server             │
│  │ DNS Server       │    "What's IP for www.example.com?"       │
│  └────┬─────────────┘                                           │
│       │ Returns IP: 93.184.216.34                               │
│       ▼                                                         │
│  IP cached at each level with TTL                               │
│                                                                  │
│  DNS RECORD TYPES:                                              │
│  ────────────────                                               │
│  A      - IPv4 address (example.com → 93.184.216.34)           │
│  AAAA   - IPv6 address                                          │
│  CNAME  - Alias (www.example.com → example.com)                 │
│  MX     - Mail server                                           │
│  TXT    - Text records (SPF, DKIM, verification)               │
│  NS     - Nameserver                                            │
│  SOA    - Start of Authority                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Load Balancing Algorithms

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOAD BALANCING ALGORITHMS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ROUND ROBIN                                                  │
│     Request 1 → Server A                                         │
│     Request 2 → Server B                                         │
│     Request 3 → Server C                                         │
│     Request 4 → Server A (repeat)                               │
│     Best for: Equal server capacity, stateless apps             │
│                                                                  │
│  2. WEIGHTED ROUND ROBIN                                        │
│     Server A (weight: 3) → Gets 3 requests                      │
│     Server B (weight: 2) → Gets 2 requests                      │
│     Server C (weight: 1) → Gets 1 request                       │
│     Best for: Servers with different capacities                 │
│                                                                  │
│  3. LEAST CONNECTIONS                                           │
│     Server A: 5 connections → Skip                              │
│     Server B: 2 connections → Choose this                       │
│     Server C: 8 connections → Skip                              │
│     Best for: Varying request processing times                  │
│                                                                  │
│  4. IP HASH                                                      │
│     hash(client_ip) % num_servers = server_index                │
│     Same client → Same server (session persistence)             │
│     Best for: Stateful applications                             │
│                                                                  │
│  5. LEAST RESPONSE TIME                                         │
│     Choose server with lowest response time                     │
│     Best for: Performance-critical applications                 │
│                                                                  │
│  LAYER 4 vs LAYER 7 LOAD BALANCING:                            │
│  ─────────────────────────────────                              │
│  Layer 4 (Transport):                                           │
│  ├── Works with TCP/UDP                                         │
│  ├── Faster (no content inspection)                             │
│  ├── Can't route based on content                               │
│  └── Example: AWS NLB                                           │
│                                                                  │
│  Layer 7 (Application):                                         │
│  ├── Works with HTTP/HTTPS                                      │
│  ├── Can inspect headers, cookies, URL                          │
│  ├── Content-based routing                                      │
│  └── Example: AWS ALB, Nginx                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### HTTPS/TLS Handshake

```
┌─────────────────────────────────────────────────────────────────┐
│                    TLS 1.3 HANDSHAKE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client                              Server                      │
│    │                                   │                         │
│    │────── ClientHello ──────────────►│                         │
│    │       + Supported Ciphers         │                         │
│    │       + Key Share (DH)            │                         │
│    │                                   │                         │
│    │◄───── ServerHello ───────────────│                         │
│    │       + Chosen Cipher             │                         │
│    │       + Key Share (DH)            │                         │
│    │       + Certificate               │                         │
│    │       + Certificate Verify        │                         │
│    │       + Finished                  │                         │
│    │                                   │                         │
│    │────── Finished ─────────────────►│                         │
│    │                                   │                         │
│    │◄═════ Encrypted Data ═══════════►│                         │
│    │                                   │                         │
│                                                                  │
│  TLS 1.3 IMPROVEMENTS over 1.2:                                 │
│  ├── 1-RTT handshake (was 2-RTT)                               │
│  ├── 0-RTT for repeat connections                               │
│  ├── Removed weak ciphers (RSA key exchange)                   │
│  ├── Forward secrecy mandatory                                  │
│  └── Encrypted handshake (from ServerHello)                    │
│                                                                  │
│  CERTIFICATE VALIDATION:                                        │
│  ──────────────────────                                         │
│  1. Check certificate not expired                               │
│  2. Verify signature chain to root CA                           │
│  3. Check certificate not revoked (OCSP/CRL)                   │
│  4. Verify domain name matches certificate                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔬 DEEP INTERNALS - How Everything ACTUALLY Works

> **This section answers: "What happens at EVERY step when a user accesses your server?"**

### Complete Request Journey: From Browser to Your Code

```
THE BIG PICTURE - WHAT HAPPENS WHEN USER TYPES "myapp.com":
═══════════════════════════════════════════════════════════

Your app runs on: localhost:3000 (inside your server)
But user accesses: https://myapp.com

HOW DOES THIS WORK? Let's trace EVERY step!

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   USER'S BROWSER                     YOUR SERVER                │
│   ──────────────                     ───────────                │
│                                                                  │
│   1. User types: myapp.com                                      │
│          │                                                       │
│          ▼                                                       │
│   2. DNS Resolution                                              │
│      "What's IP of myapp.com?"                                  │
│          │                                                       │
│          ▼                                                       │
│      DNS returns: 54.23.167.89 (Your server's PUBLIC IP)        │
│          │                                                       │
│          ▼                                                       │
│   3. Browser connects to 54.23.167.89:443 (HTTPS = port 443)    │
│          │                                                       │
│          ▼                                                       │
│   4. TLS Handshake (SSL certificate verification)               │
│          │                                                       │
│          ▼                                                       │
│   5. HTTP Request sent:                                          │
│      GET / HTTP/1.1                                              │
│      Host: myapp.com                                             │
│          │                                                       │
│          │                           ┌─────────────────────┐    │
│          │                           │    YOUR SERVER       │    │
│          │                           │                      │    │
│          │                           │  Public IP:          │    │
│          └──────────────────────────►│  54.23.167.89        │    │
│                                      │                      │    │
│                                      │  Nginx listens on    │    │
│                                      │  Port 80/443         │    │
│                                      │         │            │    │
│                                      │         ▼            │    │
│                                      │  Reverse Proxy to    │    │
│                                      │  localhost:3000      │    │
│                                      │         │            │    │
│                                      │         ▼            │    │
│                                      │  Your Node.js/       │    │
│                                      │  Spring Boot App     │    │
│                                      │  (Port 3000)         │    │
│                                      └─────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step-by-Step: Complete Packet Journey

```
DETAILED BREAKDOWN - EVERY MILLISECOND:
═══════════════════════════════════════

STEP 1: DNS RESOLUTION (50-200ms first time, <1ms cached)
─────────────────────────────────────────────────────────

User types: myapp.com

Browser checks cache → Not found
OS checks /etc/hosts → Not found
OS checks DNS cache → Not found

Query to DNS Resolver (usually ISP):
┌──────────────────────────────────────────────────────────────┐
│ DNS Query Packet:                                             │
│ ─────────────────                                             │
│ Source IP: 192.168.1.100 (User's local IP)                   │
│ Dest IP: 8.8.8.8 (Google DNS or ISP DNS)                     │
│ Source Port: 54321 (random high port)                         │
│ Dest Port: 53 (DNS always uses port 53)                       │
│ Protocol: UDP                                                  │
│ Query: "What is A record for myapp.com?"                      │
└──────────────────────────────────────────────────────────────┘

DNS Response:
┌──────────────────────────────────────────────────────────────┐
│ myapp.com → 54.23.167.89                                      │
│ TTL: 300 seconds (cache for 5 minutes)                        │
└──────────────────────────────────────────────────────────────┘


STEP 2: TCP CONNECTION (3-way handshake, ~30-100ms)
───────────────────────────────────────────────────

Browser knows: Server IP = 54.23.167.89
Browser wants: Connect to port 443 (HTTPS)

Packet 1 - SYN:
┌──────────────────────────────────────────────────────────────┐
│ Source IP: 103.45.67.89 (User's PUBLIC IP via NAT)           │
│ Dest IP: 54.23.167.89                                         │
│ Source Port: 52431 (random)                                   │
│ Dest Port: 443                                                │
│ Flags: SYN                                                    │
│ Sequence: 1000 (random starting number)                       │
│ Window Size: 65535 (how much data can receive)               │
└──────────────────────────────────────────────────────────────┘

Packet 2 - SYN-ACK (Server responds):
┌──────────────────────────────────────────────────────────────┐
│ Source IP: 54.23.167.89                                       │
│ Dest IP: 103.45.67.89                                         │
│ Source Port: 443                                              │
│ Dest Port: 52431                                              │
│ Flags: SYN, ACK                                               │
│ Sequence: 5000 (server's starting number)                     │
│ Acknowledgment: 1001 (client's seq + 1)                       │
└──────────────────────────────────────────────────────────────┘

Packet 3 - ACK (Connection established!):
┌──────────────────────────────────────────────────────────────┐
│ Flags: ACK                                                    │
│ Sequence: 1001                                                │
│ Acknowledgment: 5001                                          │
│ → TCP CONNECTION ESTABLISHED!                                 │
└──────────────────────────────────────────────────────────────┘


STEP 3: TLS HANDSHAKE (~100-300ms)
──────────────────────────────────

Now browser and server exchange encryption keys...

Client Hello:
┌──────────────────────────────────────────────────────────────┐
│ TLS Version: 1.3                                              │
│ Supported Ciphers:                                            │
│   - TLS_AES_256_GCM_SHA384                                   │
│   - TLS_CHACHA20_POLY1305_SHA256                             │
│ Supported Groups: x25519, secp256r1                          │
│ Key Share: [client's public key for DH exchange]             │
│ SNI: myapp.com (Server Name Indication)                       │
└──────────────────────────────────────────────────────────────┘

Server Hello + Certificate:
┌──────────────────────────────────────────────────────────────┐
│ Chosen Cipher: TLS_AES_256_GCM_SHA384                        │
│ Key Share: [server's public key]                              │
│ Certificate: [X.509 certificate for myapp.com]               │
│ Certificate Chain: myapp.com → Intermediate CA → Root CA     │
└──────────────────────────────────────────────────────────────┘

→ Both sides now compute shared secret using Diffie-Hellman
→ All further communication is ENCRYPTED


STEP 4: HTTP REQUEST (inside encrypted TLS tunnel)
──────────────────────────────────────────────────

Encrypted HTTP Request:
┌──────────────────────────────────────────────────────────────┐
│ GET /api/users HTTP/1.1                                       │
│ Host: myapp.com                                               │
│ User-Agent: Chrome/120.0.0.0                                  │
│ Accept: application/json                                      │
│ Accept-Encoding: gzip, deflate, br                           │
│ Connection: keep-alive                                        │
│ Cookie: session=abc123                                        │
│                                                               │
│ (This entire request is encrypted before sending)            │
└──────────────────────────────────────────────────────────────┘


STEP 5: SERVER RECEIVES REQUEST
───────────────────────────────

Request arrives at server's Network Interface Card (NIC)

┌──────────────────────────────────────────────────────────────┐
│                         YOUR SERVER                           │
│                                                               │
│  ┌─────────────┐                                             │
│  │ Network Card│ ← Receives ethernet frame                   │
│  │ (NIC)       │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │ Linux Kernel│ ← Processes IP packet                       │
│  │ Network     │                                             │
│  │ Stack       │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ Kernel checks: Which process listens on port 443?  │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │   Nginx     │ ← Process bound to port 443                 │
│  │ (PID: 1234) │                                             │
│  └──────┬──────┘                                             │
│         │                                                     │
│         │ Nginx reads nginx.conf:                            │
│         │ "For myapp.com, proxy to localhost:3000"           │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────┐                                             │
│  │ Your App    │ ← Your code finally runs!                   │
│  │ (Port 3000) │                                             │
│  └─────────────┘                                             │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### How Port 80/443 Connects to Port 3000

```
THE KEY CONCEPT: REVERSE PROXY
══════════════════════════════

WHY can't we directly expose port 3000?
──────────────────────────────────────
1. Security: Don't expose app directly
2. SSL Termination: Let Nginx handle HTTPS
3. Multiple apps: Run many apps on one server
4. Load balancing: Distribute traffic
5. Static files: Nginx serves them faster

NGINX CONFIGURATION:
───────────────────

# /etc/nginx/sites-available/myapp.conf

server {
    listen 80;
    server_name myapp.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name myapp.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/myapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/myapp.com/privkey.pem;

    # Reverse proxy to your app
    location / {
        proxy_pass http://127.0.0.1:3000;  # ← HERE! Forward to port 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}


FLOW DIAGRAM:
─────────────

Internet            Your Server
────────            ───────────

Browser ──────────► Port 443 (Nginx)
   │                     │
   │                     │ SSL Termination
   │                     │ (decrypt HTTPS)
   │                     │
   │                     ▼
   │                Port 3000 (Your App)
   │                     │
   │                     │ Process request
   │                     │
   │                     ▼
   │                Response
   │                     │
   │                     │ Encrypt with SSL
   │                     │
   │ ◄───────────────────┘
Response


WHAT HAPPENS IN LINUX KERNEL:
────────────────────────────

$ netstat -tlnp

Proto  Local Address    Foreign Address   State    PID/Program
tcp    0.0.0.0:80       0.0.0.0:*         LISTEN   1234/nginx
tcp    0.0.0.0:443      0.0.0.0:*         LISTEN   1234/nginx
tcp    127.0.0.1:3000   0.0.0.0:*         LISTEN   5678/node

Explanation:
- Nginx (PID 1234) listens on ports 80 and 443 (all interfaces: 0.0.0.0)
- Node.js (PID 5678) listens on port 3000 (only localhost: 127.0.0.1)
- Port 3000 is NOT accessible from outside (127.0.0.1 = localhost only)
```

### Local IP vs Public IP vs NAT

```
IP ADDRESS TYPES - COMPLETE EXPLANATION:
═══════════════════════════════════════

YOUR HOME NETWORK:
─────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                  │
│                           │                                      │
│                    Public IP: 103.45.67.89                      │
│                    (Given by ISP)                                │
│                           │                                      │
│                     ┌─────▼─────┐                               │
│                     │  Router   │                               │
│                     │ (NAT)     │                               │
│                     └─────┬─────┘                               │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐              │
│    │ Laptop  │      │ Phone   │      │ Desktop │              │
│    │192.168. │      │192.168. │      │192.168. │              │
│    │  1.100  │      │  1.101  │      │  1.102  │              │
│    └─────────┘      └─────────┘      └─────────┘              │
│                                                                  │
│    These are PRIVATE IPs (not routable on internet)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PRIVATE IP RANGES (RFC 1918):
────────────────────────────
10.0.0.0    - 10.255.255.255   (Class A: 16 million addresses)
172.16.0.0  - 172.31.255.255   (Class B: 1 million addresses)
192.168.0.0 - 192.168.255.255  (Class C: 65,536 addresses)

These IPs are NOT routable on the public internet!


NAT (Network Address Translation) - How it works:
────────────────────────────────────────────────

Your laptop (192.168.1.100) wants to access google.com

OUTGOING:
┌──────────────────────────────────────────────────────────────┐
│ Original packet from laptop:                                  │
│   Source: 192.168.1.100:54321                                │
│   Dest: 142.250.190.78:443 (google.com)                      │
│                                                               │
│ Router NAT translation table:                                 │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Internal IP:Port    │ External IP:Port  │ Destination │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 192.168.1.100:54321 │ 103.45.67.89:40001│ google.com  │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
│ Packet sent to internet:                                      │
│   Source: 103.45.67.89:40001 (public IP)                     │
│   Dest: 142.250.190.78:443                                   │
└──────────────────────────────────────────────────────────────┘

INCOMING (response):
┌──────────────────────────────────────────────────────────────┐
│ Google responds:                                              │
│   Source: 142.250.190.78:443                                 │
│   Dest: 103.45.67.89:40001                                   │
│                                                               │
│ Router looks up NAT table:                                    │
│   40001 → 192.168.1.100:54321                                │
│                                                               │
│ Packet delivered to laptop:                                   │
│   Source: 142.250.190.78:443                                 │
│   Dest: 192.168.1.100:54321                                  │
└──────────────────────────────────────────────────────────────┘


PORT FORWARDING (for servers):
─────────────────────────────

Your home server runs on 192.168.1.50:3000
You want external access

Router port forwarding rule:
┌──────────────────────────────────────────────────────────────┐
│ External: 103.45.67.89:8080                                   │
│ Internal: 192.168.1.50:3000                                   │
│                                                               │
│ Now: http://103.45.67.89:8080 → your server!                 │
└──────────────────────────────────────────────────────────────┘


WHY SERVERS HAVE STATIC PUBLIC IPs:
──────────────────────────────────

Home connection: Dynamic IP (changes periodically)
Server (AWS/Azure): Static Elastic IP (never changes)

Without static IP:
- DNS record becomes invalid when IP changes
- Users can't reach your server

AWS Elastic IP:
- Reserved public IP for your account
- Stays same even if instance restarts
- Can move between instances
```

---

## 🧠 Operating System Internals - Process & Thread Management

### What is a Process?

```
PROCESS - COMPLETE EXPLANATION:
══════════════════════════════

When you run: node server.js

Operating System creates a PROCESS:
┌─────────────────────────────────────────────────────────────────┐
│                         PROCESS                                  │
│                     (PID: 5678)                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    VIRTUAL MEMORY SPACE                      ││
│  │                   (4GB on 32-bit, 128TB on 64-bit)          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │                                                              ││
│  │  HIGH ADDRESSES (e.g., 0xFFFFFFFF)                          ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                    KERNEL SPACE                       │   ││
│  │  │        (OS kernel, not accessible by process)         │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                      STACK                            │   ││
│  │  │    - Function call frames                             │   ││
│  │  │    - Local variables                                  │   ││
│  │  │    - Return addresses                                 │   ││
│  │  │    - Grows DOWNWARD ↓                                 │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                         │                                    ││
│  │                         ▼ (grows down)                       ││
│  │                                                              ││
│  │                         ▲ (grows up)                         ││
│  │                         │                                    ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                      HEAP                             │   ││
│  │  │    - Dynamic memory allocation                        │   ││
│  │  │    - Objects, arrays                                  │   ││
│  │  │    - malloc(), new                                    │   ││
│  │  │    - Grows UPWARD ↑                                   │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  BSS SEGMENT                          │   ││
│  │  │    - Uninitialized global variables                   │   ││
│  │  │    - static int count;                                │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  DATA SEGMENT                         │   ││
│  │  │    - Initialized global variables                     │   ││
│  │  │    - static int count = 10;                           │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                  TEXT SEGMENT                         │   ││
│  │  │    - Executable code                                  │   ││
│  │  │    - Read-only                                        │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │  LOW ADDRESSES (e.g., 0x00000000)                           ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  PROCESS CONTROL BLOCK (PCB) - OS maintains this:              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ PID: 5678                                                │   │
│  │ State: RUNNING / READY / BLOCKED / ZOMBIE               │   │
│  │ Program Counter: Current instruction address            │   │
│  │ CPU Registers: Saved register values                    │   │
│  │ Memory Limits: Stack/heap boundaries                    │   │
│  │ Open Files: File descriptors [0, 1, 2, 3...]           │   │
│  │ Parent PID: 1234                                        │   │
│  │ Priority: Nice value (-20 to +19)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PROCESS LIFECYCLE:
─────────────────

    fork()           exec()            wait()
   ┌──────┐        ┌──────┐         ┌──────┐
   │ NEW  │───────►│READY │◄───────►│RUNNING│
   └──────┘        └──────┘         └──────┘
                       ▲                │
                       │                │ I/O request
                       │                ▼
                       │           ┌──────────┐
                       │           │ BLOCKED  │
                       │           │(waiting) │
                       │           └──────────┘
                       │                │
                       └────────────────┘
                         I/O complete
                                        │ exit()
                                        ▼
                                   ┌──────────┐
                                   │ ZOMBIE   │
                                   │(terminated│
                                   │but not   │
                                   │reaped)   │
                                   └──────────┘
```

### What is a Thread?

```
THREAD - COMPLETE EXPLANATION:
═════════════════════════════

Thread = Lightweight process (shares process resources)

┌─────────────────────────────────────────────────────────────────┐
│                         PROCESS                                  │
│                      (PID: 5678)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SHARED BETWEEN ALL THREADS:                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ • Code (Text) segment                                        ││
│  │ • Data segment (global variables)                            ││
│  │ • Heap (dynamically allocated memory)                        ││
│  │ • Open files                                                 ││
│  │ • Signal handlers                                            ││
│  │ • Current working directory                                  ││
│  │ • User and group IDs                                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  UNIQUE TO EACH THREAD:                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Thread 1   │  │   Thread 2   │  │   Thread 3   │          │
│  │   (Main)     │  │   (Worker)   │  │   (Worker)   │          │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤          │
│  │ Thread ID    │  │ Thread ID    │  │ Thread ID    │          │
│  │ Stack        │  │ Stack        │  │ Stack        │          │
│  │ Registers    │  │ Registers    │  │ Registers    │          │
│  │ Program Cnt  │  │ Program Cnt  │  │ Program Cnt  │          │
│  │ Stack Ptr    │  │ Stack Ptr    │  │ Stack Ptr    │          │
│  │ Priority     │  │ Priority     │  │ Priority     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


THREAD vs PROCESS - KEY DIFFERENCES:
───────────────────────────────────

┌─────────────────────┬──────────────────────┬────────────────────┐
│     Aspect          │      Process         │       Thread       │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Memory              │ Separate address     │ Shared address     │
│                     │ space                │ space              │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Creation time       │ Heavy (~ms)          │ Light (~μs)        │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Context switch      │ Slow (TLB flush)     │ Fast               │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Communication       │ IPC (pipes, sockets, │ Direct memory      │
│                     │ shared memory)       │ access             │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Crash impact        │ Only that process    │ Whole process      │
│                     │ crashes              │ may crash          │
├─────────────────────┼──────────────────────┼────────────────────┤
│ Resource overhead   │ High (own memory,    │ Low (shared        │
│                     │ file descriptors)    │ resources)         │
└─────────────────────┴──────────────────────┴────────────────────┘


THREAD MEMORY - STACK SIZE:
──────────────────────────

Default stack size per thread:
  Linux:   8 MB (can change with ulimit -s)
  Windows: 1 MB
  Java:    512 KB - 1 MB (depends on JVM)

With 100 threads:
  100 × 8MB = 800 MB just for stacks!

This is why thread pools matter!
```

### How Multiple Users Create Threads

```
WEB SERVER THREAD MODEL:
═══════════════════════

When 1000 users hit your server simultaneously...

TRADITIONAL MODEL (Thread per request):
──────────────────────────────────────

User 1 → Thread 1 → Process request → Response → Thread dies
User 2 → Thread 2 → Process request → Response → Thread dies
User 3 → Thread 3 → Process request → Response → Thread dies
...
User 1000 → Thread 1000 → Process request → Response → Thread dies

PROBLEM:
┌──────────────────────────────────────────────────────────────┐
│ 1000 threads × 1MB stack = 1GB RAM just for stacks!          │
│ Thread creation overhead: ~1ms per thread                     │
│ Context switching: OS must switch between 1000 threads        │
│ = SLOW and MEMORY HUNGRY                                      │
└──────────────────────────────────────────────────────────────┘


THREAD POOL MODEL (Reuse threads):
─────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                        THREAD POOL                               │
│                       (e.g., 200 threads)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   REQUEST QUEUE                          │   │
│  │    [Req1] [Req2] [Req3] ... [Req1000]                   │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│   ┌──────────┐       ┌──────────┐       ┌──────────┐          │
│   │ Thread 1 │       │ Thread 2 │       │Thread 200│          │
│   │ Pick Req │       │ Pick Req │       │ Pick Req │          │
│   │ Process  │       │ Process  │       │ Process  │          │
│   │ Return   │       │ Return   │       │ Return   │          │
│   │ Pick Next│       │ Pick Next│       │ Pick Next│          │
│   └──────────┘       └──────────┘       └──────────┘          │
│                                                                  │
│  Benefits:                                                       │
│  • Only 200 threads × 1MB = 200MB RAM                          │
│  • No thread creation overhead                                  │
│  • Less context switching                                       │
│  • Handles 1000+ requests with 200 threads                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


JAVA SPRING BOOT THREAD MODEL:
─────────────────────────────

# application.properties

# Tomcat thread pool settings
server.tomcat.threads.min-spare=10     # Minimum threads always running
server.tomcat.threads.max=200          # Maximum threads
server.tomcat.max-connections=10000    # Max pending connections
server.tomcat.accept-count=100         # Queue when max connections reached


EVENT LOOP MODEL (Node.js):
──────────────────────────

Node.js uses SINGLE THREAD + Event Loop (non-blocking I/O)

┌─────────────────────────────────────────────────────────────────┐
│                      NODE.JS EVENT LOOP                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Single Thread (Main Thread):                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                   EVENT QUEUE                         │   ││
│  │  │  [HTTP Req] [Timer] [File Read Done] [DB Query Done] │   ││
│  │  └──────────────────────────┬───────────────────────────┘   ││
│  │                             │                                ││
│  │                             ▼                                ││
│  │  ┌──────────────────────────────────────────────────────┐   ││
│  │  │                   EVENT LOOP                          │   ││
│  │  │                                                       │   ││
│  │  │  while(true) {                                       │   ││
│  │  │    event = queue.pop()                               │   ││
│  │  │    callback = getCallback(event)                     │   ││
│  │  │    callback()  // Execute synchronously              │   ││
│  │  │  }                                                   │   ││
│  │  └──────────────────────────────────────────────────────┘   ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Background Thread Pool (libuv, 4 threads default):             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • File I/O                                                  ││
│  │  • DNS lookups                                               ││
│  │  • Some crypto operations                                    ││
│  │  • Compression                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  OS handles (not threads):                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Network I/O (uses epoll/kqueue/IOCP)                     ││
│  │  • Timers                                                    ││
│  │  • Async DNS (via c-ares)                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

WHY NODE.JS CAN HANDLE MANY CONNECTIONS:
───────────────────────────────────────
• Most time is spent WAITING for I/O (DB, files, network)
• While waiting, event loop handles other requests
• No thread per connection = low memory
• 1 thread can handle 10,000+ concurrent connections!

LIMITATION:
───────────
• CPU-intensive tasks block the event loop
• Heavy computation? Use Worker Threads or separate service
```

### System Overload - What Happens?

```
HOW SYSTEM OVERLOAD HAPPENS:
═══════════════════════════

SCENARIO: Your server gets more traffic than it can handle

┌─────────────────────────────────────────────────────────────────┐
│                    OVERLOAD PROGRESSION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Stage 1: Normal Operation                                      │
│  ─────────────────────────                                      │
│  CPU: 40%   RAM: 60%   Response Time: 50ms                      │
│  Thread Pool: 50/200 threads active                             │
│  ✓ Everything fine                                              │
│                                                                  │
│  Stage 2: High Load                                             │
│  ───────────────────                                            │
│  CPU: 75%   RAM: 80%   Response Time: 200ms                     │
│  Thread Pool: 180/200 threads active                            │
│  ⚠ Getting busy, queue building up                              │
│                                                                  │
│  Stage 3: Saturation                                            │
│  ───────────────────                                            │
│  CPU: 95%   RAM: 90%   Response Time: 2000ms                    │
│  Thread Pool: 200/200 threads (MAX)                             │
│  Queue: 500 requests waiting                                    │
│  ⚠ Requests timing out                                          │
│                                                                  │
│  Stage 4: Collapse                                              │
│  ─────────────────                                              │
│  CPU: 100%  RAM: 98%   Response Time: TIMEOUT                   │
│  Thread Pool: All threads busy, new connections rejected        │
│  Queue: FULL (10000), dropping requests                         │
│  ✗ System unresponsive                                          │
│                                                                  │
│  Stage 5: OOM (Out of Memory)                                   │
│  ───────────────────────────                                    │
│  RAM: 100%                                                       │
│  OOM Killer: Kills processes to free memory                     │
│  ✗ Your app may be killed                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


WHAT HAPPENS IN EACH RESOURCE:
─────────────────────────────

CPU OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Context switching overhead increases                        │
│ • CPU spends more time switching than doing work             │
│ • Scheduler can't keep up                                    │
│ • "Thrashing" - system doing work but nothing productive     │
└──────────────────────────────────────────────────────────────┘

RAM OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Swap starts being used (disk as RAM - VERY SLOW)           │
│ • Constant swapping = "thrashing"                            │
│ • OOM killer may kill processes                              │
│ • malloc() starts failing                                    │
└──────────────────────────────────────────────────────────────┘

THREAD POOL OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • All threads busy                                           │
│ • New requests queue up                                      │
│ • Queue fills up                                             │
│ • New connections rejected (503 Service Unavailable)         │
└──────────────────────────────────────────────────────────────┘

NETWORK OVERLOAD:
┌──────────────────────────────────────────────────────────────┐
│ • Accept queue full (pending TCP connections)                │
│ • Packets dropped                                            │
│ • Connections refused or timing out                          │
│ • Bandwidth saturated                                        │
└──────────────────────────────────────────────────────────────┘


PROTECTION MECHANISMS:
─────────────────────

1. CONNECTION LIMITS:
   server.tomcat.max-connections=10000

2. RATE LIMITING:
   Max 100 requests/second per IP

3. CIRCUIT BREAKER:
   If service unhealthy → stop sending requests

4. LOAD BALANCER HEALTH CHECKS:
   Unhealthy server → remove from pool

5. AUTO-SCALING:
   CPU > 80% → spawn new server instances

6. BACKPRESSURE:
   Tell clients to slow down (HTTP 429)


MONITORING COMMANDS:
───────────────────

# CPU per process
$ top
$ htop

# Memory usage
$ free -m
$ cat /proc/meminfo

# Open files and connections
$ lsof -p <pid>
$ ss -s

# Thread count for process
$ ps -p <pid> -T | wc -l

# System load average
$ uptime
# Load average: 4.00, 3.50, 3.00
# (last 1 min, 5 min, 15 min)
# If load > number of CPU cores → system overloaded
```

### Complete Request Processing - OS Level

```
COMPLETE PICTURE: HTTP REQUEST → RESPONSE:
═════════════════════════════════════════

Step-by-step what happens in the OS:

1. PACKET ARRIVES AT SERVER:
───────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Network Interface Card (NIC) receives electrical signals     │
│                         │                                    │
│                         ▼                                    │
│ NIC decodes to ethernet frame                               │
│                         │                                    │
│                         ▼                                    │
│ NIC raises HARDWARE INTERRUPT (IRQ)                         │
│                         │                                    │
│                         ▼                                    │
│ CPU pauses current work, runs interrupt handler             │
│                         │                                    │
│                         ▼                                    │
│ Interrupt handler copies frame to kernel buffer             │
│ (ring buffer / DMA transfer)                                │
└──────────────────────────────────────────────────────────────┘

2. KERNEL PROCESSES PACKET:
──────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Network Stack Processing (softirq context):                  │
│                                                              │
│ Layer 2 (Data Link):                                        │
│   - Verify ethernet checksum                                │
│   - Extract destination MAC                                 │
│   - If not for us, drop (or forward if router)             │
│                         │                                    │
│                         ▼                                    │
│ Layer 3 (Network):                                          │
│   - Parse IP header                                         │
│   - Verify IP checksum                                      │
│   - Check if destination IP is ours                         │
│   - Firewall rules (iptables/nftables)                     │
│                         │                                    │
│                         ▼                                    │
│ Layer 4 (Transport):                                        │
│   - Parse TCP header                                        │
│   - Find matching socket (by src/dst IP:port)              │
│   - Verify TCP checksum                                     │
│   - Handle TCP state machine (SYN/ACK/FIN etc)             │
│                         │                                    │
│                         ▼                                    │
│ Socket Receive Queue:                                       │
│   - Data added to socket's receive buffer                  │
│   - Process waiting on recv() is woken up                  │
└──────────────────────────────────────────────────────────────┘

3. APPLICATION RECEIVES DATA:
────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Nginx Process:                                               │
│                                                              │
│ epoll_wait() returns → "Socket 42 has data"                 │
│                         │                                    │
│                         ▼                                    │
│ read(socket_fd, buffer, size)                               │
│   - Copies data from kernel buffer to user buffer          │
│   - Context switch: user mode → kernel mode → user mode    │
│                         │                                    │
│                         ▼                                    │
│ Parse HTTP request                                          │
│   - Method: GET                                             │
│   - Path: /api/users                                        │
│   - Headers: Host, Accept, Cookie...                        │
│                         │                                    │
│                         ▼                                    │
│ Determine action (based on nginx.conf)                      │
│   - Static file? → Read from disk, send                    │
│   - Proxy pass? → Forward to backend                       │
└──────────────────────────────────────────────────────────────┘

4. PROXY TO BACKEND (localhost:3000):
────────────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Nginx creates NEW connection to localhost:3000              │
│                                                              │
│ connect(backend_socket, "127.0.0.1:3000")                   │
│   - TCP handshake (all in kernel, super fast on localhost) │
│                         │                                    │
│                         ▼                                    │
│ write(backend_socket, http_request)                         │
│   - Send HTTP request to backend                            │
│                         │                                    │
│                         ▼                                    │
│ Kernel: localhost traffic never leaves machine             │
│   - No NIC involved                                         │
│   - Data goes through loopback interface (lo)              │
│   - Super fast                                              │
└──────────────────────────────────────────────────────────────┘

5. YOUR APPLICATION CODE RUNS:
─────────────────────────────

┌──────────────────────────────────────────────────────────────┐
│ Node.js / Spring Boot:                                       │
│                                                              │
│ Event loop / Thread pool thread picks up request            │
│                         │                                    │
│                         ▼                                    │
│ Parse request, route to handler                             │
│                         │                                    │
│                         ▼                                    │
│ Handler executes:                                           │
│   - Validate input                                          │
│   - Query database (await/blocking)                         │
│   - Process business logic                                  │
│   - Format response                                         │
│                         │                                    │
│                         ▼                                    │
│ Write response to socket                                    │
└──────────────────────────────────────────────────────────────┘

6. RESPONSE TRAVELS BACK:
────────────────────────

Same path in reverse:
Your app → Nginx → Kernel → NIC → Internet → User's browser


TOTAL TIME BREAKDOWN (typical):
──────────────────────────────

┌─────────────────────────────────────────────────────────────┐
│ DNS Resolution:           0-50ms (cached) / 50-200ms (not) │
│ TCP Handshake:           15-50ms                           │
│ TLS Handshake:           50-150ms                          │
│ Request to Server:       10-50ms (network latency)         │
│ Server Processing:       10-500ms (depends on work)        │
│ Response to Client:      10-50ms (network latency)         │
│ Browser Render:          50-500ms                          │
│ ────────────────────────────────────────────────────────── │
│ TOTAL:                   145ms - 1500ms                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI/UX Deep Internals

### How Browser Renders a Page

```
BROWSER RENDERING PIPELINE:
═══════════════════════════

When browser receives HTML:

┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL RENDERING PATH                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. HTML PARSING → DOM Tree                                     │
│  ──────────────────────────                                     │
│                                                                  │
│  <html>                       ┌─────────┐                       │
│    <head>                     │  html   │                       │
│      <title>                  └────┬────┘                       │
│    </head>              ┌──────────┼──────────┐                 │
│    <body>               │                     │                 │
│      <div>          ┌───▼───┐            ┌───▼───┐              │
│        <p>          │  head │            │  body │              │
│      </div>         └───┬───┘            └───┬───┘              │
│    </body>              │                    │                   │
│  </html>            ┌───▼───┐            ┌───▼───┐              │
│                     │ title │            │  div  │              │
│                     └───────┘            └───┬───┘              │
│                                              │                   │
│                                          ┌───▼───┐              │
│                                          │   p   │              │
│                                          └───────┘              │
│                                                                  │
│  2. CSS PARSING → CSSOM Tree                                    │
│  ───────────────────────────                                    │
│                                                                  │
│  body { color: black; }       ┌─────────┐                       │
│  div { display: flex; }       │  body   │                       │
│  p { font-size: 16px; }       │ color:  │                       │
│                               │  black  │                       │
│                               └────┬────┘                       │
│                                    │                             │
│                               ┌────▼────┐                       │
│                               │   div   │                       │
│                               │display: │                       │
│                               │  flex   │                       │
│                               └────┬────┘                       │
│                                    │                             │
│                               ┌────▼────┐                       │
│                               │    p    │                       │
│                               │font-size│                       │
│                               │  16px   │                       │
│                               └─────────┘                       │
│                                                                  │
│  3. RENDER TREE (DOM + CSSOM)                                   │
│  ────────────────────────────                                   │
│                                                                  │
│  • Combines DOM and CSSOM                                       │
│  • Only visible elements (no <head>, display:none)             │
│  • Contains computed styles                                     │
│                                                                  │
│  4. LAYOUT (Reflow)                                             │
│  ──────────────────                                             │
│                                                                  │
│  • Calculate exact position and size                            │
│  • "Where does each element go?"                                │
│  • Triggered by: resize, content change, style change          │
│                                                                  │
│  5. PAINT                                                        │
│  ───────                                                        │
│                                                                  │
│  • Convert to actual pixels                                     │
│  • Draw text, colors, shadows, borders                         │
│  • Create paint records                                         │
│                                                                  │
│  6. COMPOSITE                                                    │
│  ────────────                                                   │
│                                                                  │
│  • Combine layers (for animations, overlaps)                   │
│  • Send to GPU                                                  │
│  • Display on screen                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PERFORMANCE IMPACT:
──────────────────

┌────────────────────┬──────────────────────────────────────────┐
│ Action             │ Triggers                                 │
├────────────────────┼──────────────────────────────────────────┤
│ Change color       │ Paint only (fast)                        │
│ Change font-size   │ Layout + Paint + Composite (slow)       │
│ Change transform   │ Composite only (fastest)                 │
│ Add DOM element    │ Layout + Paint + Composite (slow)       │
│ Scroll             │ Composite (fast with layers)            │
└────────────────────┴──────────────────────────────────────────┘

OPTIMIZATION TIPS:
─────────────────
• Use transform for animations (GPU accelerated)
• Avoid layout thrashing (batch DOM reads/writes)
• Use will-change for elements that will animate
• Lazy load below-fold content
```

### JavaScript Event Loop (Browser)

```
BROWSER EVENT LOOP:
══════════════════

JavaScript is single-threaded, but handles async through Event Loop

┌─────────────────────────────────────────────────────────────────┐
│                    JAVASCRIPT RUNTIME                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      CALL STACK                              ││
│  │                                                              ││
│  │  • Executes code synchronously                              ││
│  │  • LIFO (Last In, First Out)                                ││
│  │  • One function at a time                                   ││
│  │                                                              ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │ calculateSum()                                       │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ processData()                                        │   ││
│  │  ├─────────────────────────────────────────────────────┤   ││
│  │  │ main()                                               │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              │ When call stack empty,           │
│                              │ event loop checks queues         │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────── │
│  │                      EVENT LOOP                              │
│  │                                                              │
│  │  while (true) {                                             │
│  │    if (callStack.isEmpty()) {                               │
│  │      // 1. Run ALL microtasks first                         │
│  │      while (microtaskQueue.hasItems()) {                   │
│  │        task = microtaskQueue.dequeue()                     │
│  │        callStack.push(task)                                │
│  │        execute(task)                                       │
│  │      }                                                      │
│  │      // 2. Run ONE macrotask                               │
│  │      if (macrotaskQueue.hasItems()) {                      │
│  │        task = macrotaskQueue.dequeue()                     │
│  │        callStack.push(task)                                │
│  │        execute(task)                                       │
│  │      }                                                      │
│  │      // 3. Render (if needed, ~60fps = every 16.67ms)      │
│  │      if (shouldRender()) {                                  │
│  │        render()                                             │
│  │      }                                                      │
│  │    }                                                        │
│  │  }                                                          │
│  └──────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              MICROTASK QUEUE (High Priority)                 ││
│  │                                                              ││
│  │  • Promise.then/catch/finally                               ││
│  │  • queueMicrotask()                                         ││
│  │  • MutationObserver                                         ││
│  │                                                              ││
│  │  [Promise1] [Promise2] [Promise3]                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              MACROTASK QUEUE (Lower Priority)                ││
│  │                                                              ││
│  │  • setTimeout/setInterval                                    ││
│  │  • DOM events (click, scroll)                               ││
│  │  • Network responses (fetch/XHR)                            ││
│  │  • I/O operations                                            ││
│  │                                                              ││
│  │  [Timeout1] [Click] [FetchResponse]                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


EXAMPLE - ORDER OF EXECUTION:
────────────────────────────

console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

OUTPUT: 1, 4, 3, 2

WHY?
1. console.log('1') → sync, runs immediately
4. console.log('4') → sync, runs immediately
3. Promise.then → microtask, runs after sync
2. setTimeout → macrotask, runs after microtasks
```

### User Experience Metrics

```
CORE WEB VITALS (Google):
═════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                      CORE WEB VITALS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LCP (Largest Contentful Paint)                              │
│  ─────────────────────────────────                              │
│  "When did main content load?"                                  │
│                                                                  │
│  Good: ≤ 2.5s    Needs Work: 2.5-4s    Poor: > 4s              │
│                                                                  │
│  Measures: Largest image, video, or text block                 │
│                                                                  │
│  Improve:                                                        │
│  • Optimize images (WebP, proper sizing)                       │
│  • Preload critical resources                                  │
│  • Use CDN                                                      │
│  • Remove render-blocking CSS/JS                               │
│                                                                  │
│                                                                  │
│  2. FID (First Input Delay) → INP (Interaction to Next Paint)  │
│  ────────────────────────────────────────────────────────────   │
│  "How quickly does page respond to interaction?"                │
│                                                                  │
│  Good: ≤ 100ms   Needs Work: 100-300ms   Poor: > 300ms         │
│                                                                  │
│  Measures: Time from click to browser response                  │
│                                                                  │
│  Improve:                                                        │
│  • Break up long tasks (< 50ms each)                           │
│  • Use web workers for heavy computation                       │
│  • Reduce JavaScript execution time                            │
│  • Defer non-critical JavaScript                               │
│                                                                  │
│                                                                  │
│  3. CLS (Cumulative Layout Shift)                               │
│  ────────────────────────────────                               │
│  "Does content jump around while loading?"                      │
│                                                                  │
│  Good: ≤ 0.1     Needs Work: 0.1-0.25    Poor: > 0.25          │
│                                                                  │
│  Measures: Unexpected layout shifts                             │
│                                                                  │
│  Improve:                                                        │
│  • Set explicit dimensions on images/videos                    │
│  • Reserve space for ads/embeds                                │
│  • Avoid inserting content above existing content              │
│  • Use CSS contain property                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


PAGE LOAD TIMELINE:
──────────────────

Time →
0ms                                                           2000ms
│                                                               │
├─────┬─────┬─────────────┬───────────────────┬────────────────┤
│     │     │             │                   │                │
│ DNS │ TCP │ TLS         │ First Byte        │ DOM Complete   │
│     │ +   │             │ (TTFB)            │                │
│     │ TLS │             │                   │                │
│     │     │             │                   │                │
└─────┴─────┴─────────────┴───────────────────┴────────────────┘

TTFB (Time to First Byte): < 600ms
FCP (First Contentful Paint): < 1.8s
LCP (Largest Contentful Paint): < 2.5s
TTI (Time to Interactive): < 3.8s
```

---

## 🔬 Docker & Kubernetes Deep Internals

### How Docker Containers Work

```
CONTAINER vs VIRTUAL MACHINE - INTERNAL DIFFERENCE:
══════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│              VIRTUAL MACHINE                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    YOUR HOST OS                          │   │
│  │                    (Windows/Mac)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HYPERVISOR                            │   │
│  │               (VirtualBox/VMware)                        │   │
│  │                                                          │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │   │     VM 1     │  │     VM 2     │  │     VM 3     │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   Your App   │  │   Your App   │  │   Your App   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │  Libraries   │  │  Libraries   │  │  Libraries   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   FULL OS    │  │   FULL OS    │  │   FULL OS    │  │   │
│  │   │ (Ubuntu 2GB) │  │ (CentOS 3GB) │  │ (Alpine 1GB) │  │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │                                                          │   │
│  │   Each VM has FULL kernel = Heavy (GBs), slow startup   │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              DOCKER CONTAINERS                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    HOST OS KERNEL                        │   │
│  │                  (Linux/Windows)                         │   │
│  │                                                          │   │
│  │  Kernel provides isolation through:                     │   │
│  │  • NAMESPACES (what container can SEE)                  │   │
│  │  • CGROUPS (what container can USE)                     │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DOCKER ENGINE                         │   │
│  │                                                          │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │   │ Container 1  │  │ Container 2  │  │ Container 3  │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │   Your App   │  │   Your App   │  │   Your App   │  │   │
│  │   ├──────────────┤  ├──────────────┤  ├──────────────┤  │   │
│  │   │  Libraries   │  │  Libraries   │  │  Libraries   │  │   │
│  │   │   (50 MB)    │  │   (30 MB)    │  │   (20 MB)    │  │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │         │                 │                 │            │   │
│  │         └─────────────────┼─────────────────┘            │   │
│  │                           │                              │   │
│  │                    SHARED KERNEL                         │   │
│  │                    (No OS per container!)               │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Containers share host kernel = Light (MBs), instant start     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


LINUX NAMESPACES - HOW ISOLATION WORKS:
──────────────────────────────────────

Namespaces make container think it has its own:

┌──────────────────┬────────────────────────────────────────────────┐
│ Namespace        │ What it isolates                               │
├──────────────────┼────────────────────────────────────────────────┤
│ PID              │ Process IDs (Container sees PID 1 as init)    │
│                  │ Can't see host processes                       │
├──────────────────┼────────────────────────────────────────────────┤
│ NET              │ Network interfaces, ports, routing             │
│                  │ Container has own eth0, localhost              │
├──────────────────┼────────────────────────────────────────────────┤
│ MNT              │ Filesystem mounts                              │
│                  │ Container sees only its own files              │
├──────────────────┼────────────────────────────────────────────────┤
│ UTS              │ Hostname                                       │
│                  │ Container can have own hostname                │
├──────────────────┼────────────────────────────────────────────────┤
│ IPC              │ Inter-process communication                    │
│                  │ Shared memory, message queues                  │
├──────────────────┼────────────────────────────────────────────────┤
│ USER             │ User and group IDs                             │
│                  │ Root in container ≠ root on host              │
└──────────────────┴────────────────────────────────────────────────┘


CGROUPS - RESOURCE LIMITING:
───────────────────────────

docker run --memory=512m --cpus=0.5 myapp

┌──────────────────────────────────────────────────────────────────┐
│                     CGROUP LIMITS                                 │
│                                                                   │
│  Memory:                                                          │
│  /sys/fs/cgroup/memory/docker/<container_id>/memory.limit_in_bytes│
│  → 536870912 (512 MB)                                            │
│  If exceeded → Container killed (OOM)                            │
│                                                                   │
│  CPU:                                                             │
│  /sys/fs/cgroup/cpu/docker/<container_id>/cpu.cfs_quota_us       │
│  → 50000 (50% of one CPU core)                                   │
│                                                                   │
│  I/O:                                                             │
│  Can limit disk read/write speed                                 │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Docker Image Layers

```
HOW DOCKER IMAGES WORK:
══════════════════════

Dockerfile:
┌────────────────────────────────────────────────────────────────┐
│ FROM openjdk:17-slim                                           │
│ WORKDIR /app                                                   │
│ COPY target/*.jar app.jar                                      │
│ EXPOSE 8080                                                    │
│ CMD ["java", "-jar", "app.jar"]                               │
└────────────────────────────────────────────────────────────────┘

Creates layered image:
┌─────────────────────────────────────────────────────────────────┐
│                    IMAGE LAYERS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 5: CMD ["java", "-jar", "app.jar"]  (metadata)    │   │
│  │ SHA256: abc123... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 4: EXPOSE 8080                       (metadata)    │   │
│  │ SHA256: def456... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 3: COPY app.jar                      (your code)   │   │
│  │ SHA256: ghi789... Size: 50 MB                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 2: WORKDIR /app                                    │   │
│  │ SHA256: jkl012... Size: 0 bytes                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Layer 1: openjdk:17-slim                 (base image)    │   │
│  │ SHA256: mno345... Size: 200 MB                          │   │
│  │ Contains: Debian + JDK 17                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TOTAL: ~250 MB                                                 │
│                                                                  │
│  KEY INSIGHT:                                                    │
│  • Layers are READ-ONLY                                         │
│  • Layers are CACHED and REUSED                                 │
│  • If Layer 1 unchanged, Docker uses cached version            │
│  • Only Layer 3 (your code) changes on rebuild                 │
│  • Second build: ~5 seconds instead of 5 minutes!              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘


CONTAINER WRITABLE LAYER:
────────────────────────

When container runs:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         CONTAINER LAYER (Read-Write)                     │   │
│  │                                                          │   │
│  │  • Log files written by app                             │   │
│  │  • Temp files                                           │   │
│  │  • Runtime data                                         │   │
│  │                                                          │   │
│  │  DELETED when container stops!                          │   │
│  │  (Unless using volumes)                                  │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          │ Union Mount (OverlayFS)               │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         IMAGE LAYERS (Read-Only)                         │   │
│  │                                                          │   │
│  │  Layer 5, Layer 4, Layer 3, Layer 2, Layer 1            │   │
│  │                                                          │   │
│  │  SHARED between all containers using same image!        │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  10 containers from same image = 1 copy of image layers        │
│  + 10 small writable layers                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes Internals

```
KUBERNETES ARCHITECTURE - DEEP DIVE:
═══════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                   KUBERNETES CLUSTER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  CONTROL PLANE                           │   │
│  │               (Master Node)                              │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │              API SERVER                           │   │   │
│  │  │                                                   │   │   │
│  │  │  • All communication goes through here           │   │   │
│  │  │  • Validates requests                            │   │   │
│  │  │  • Updates etcd                                  │   │   │
│  │  │  • Exposes REST API                              │   │   │
│  │  │                                                   │   │   │
│  │  │  kubectl get pods → API Server → etcd → response│   │   │
│  │  │                                                   │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                          │                               │   │
│  │              ┌───────────┴───────────┐                  │   │
│  │              │                       │                  │   │
│  │  ┌───────────▼──────────┐  ┌────────▼─────────┐        │   │
│  │  │     ETCD            │  │  CONTROLLER      │        │   │
│  │  │                      │  │  MANAGER         │        │   │
│  │  │  • Distributed       │  │                  │        │   │
│  │  │    key-value store   │  │  • ReplicaSet    │        │   │
│  │  │  • Stores all        │  │    Controller    │        │   │
│  │  │    cluster state     │  │  • Deployment    │        │   │
│  │  │  • "Source of truth" │  │    Controller    │        │   │
│  │  │                      │  │  • Node          │        │   │
│  │  │                      │  │    Controller    │        │   │
│  │  └──────────────────────┘  └──────────────────┘        │   │
│  │                                      │                  │   │
│  │                          ┌───────────┴──────────┐      │   │
│  │                          │                      │      │   │
│  │              ┌───────────▼──────────┐           │      │   │
│  │              │     SCHEDULER        │           │      │   │
│  │              │                      │           │      │   │
│  │              │  • Watches for pods  │           │      │   │
│  │              │    without node      │           │      │   │
│  │              │  • Selects best node │           │      │   │
│  │              │    (resources,       │           │      │   │
│  │              │    affinity, taints) │           │      │   │
│  │              │                      │           │      │   │
│  │              └──────────────────────┘           │      │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   WORKER NODES                           │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │                  NODE 1                             │ │   │
│  │  │                                                     │ │   │
│  │  │  ┌─────────────────────────────────────────────┐   │ │   │
│  │  │  │              KUBELET                         │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  │  • Agent running on each node               │   │ │   │
│  │  │  │  • Watches API server for pod assignments   │   │ │   │
│  │  │  │  • Ensures containers are running           │   │ │   │
│  │  │  │  • Reports node status                      │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  └─────────────────────────────────────────────┘   │ │   │
│  │  │                        │                           │ │   │
│  │  │  ┌─────────────────────▼───────────────────────┐   │ │   │
│  │  │  │         CONTAINER RUNTIME                    │   │ │   │
│  │  │  │       (containerd/CRI-O)                     │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  │  Actually runs the containers               │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  └─────────────────────────────────────────────┘   │ │   │
│  │  │                        │                           │ │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │ │   │
│  │  │  │  Pod 1   │  │  Pod 2   │  │  Pod 3   │         │ │   │
│  │  │  │ ┌──────┐ │  │ ┌──────┐ │  │ ┌──────┐ │         │ │   │
│  │  │  │ │ App  │ │  │ │ App  │ │  │ │ App  │ │         │ │   │
│  │  │  │ └──────┘ │  │ │Sidecar││  │ └──────┘ │         │ │   │
│  │  │  └──────────┘  │ └──────┘ │  └──────────┘         │ │   │
│  │  │                └──────────┘                        │ │   │
│  │  │                                                     │ │   │
│  │  │  ┌─────────────────────────────────────────────┐   │ │   │
│  │  │  │              KUBE-PROXY                      │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  │  • Network proxy on each node               │   │ │   │
│  │  │  │  • Implements Service abstraction           │   │ │   │
│  │  │  │  • iptables/ipvs rules for routing          │   │ │   │
│  │  │  │                                              │   │ │   │
│  │  │  └─────────────────────────────────────────────┘   │ │   │
│  │  │                                                     │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pod Scheduling - How It Works

```
WHAT HAPPENS WHEN YOU CREATE A DEPLOYMENT:
═════════════════════════════════════════

kubectl apply -f deployment.yaml

┌─────────────────────────────────────────────────────────────────┐
│              POD SCHEDULING FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STEP 1: User submits deployment                                │
│  ───────────────────────────────                                │
│                                                                  │
│  kubectl → API Server → Validate → Store in etcd               │
│                                                                  │
│  etcd now has:                                                  │
│  {                                                               │
│    "kind": "Deployment",                                        │
│    "spec": { "replicas": 3, ... }                               │
│  }                                                               │
│                                                                  │
│                                                                  │
│  STEP 2: Deployment Controller creates ReplicaSet              │
│  ─────────────────────────────────────────────────             │
│                                                                  │
│  Controller Manager watches for Deployment changes              │
│  → Sees new Deployment                                          │
│  → Creates ReplicaSet with same spec                           │
│                                                                  │
│                                                                  │
│  STEP 3: ReplicaSet Controller creates Pods                    │
│  ─────────────────────────────────────────────                  │
│                                                                  │
│  ReplicaSet controller watches for ReplicaSet changes          │
│  → Sees ReplicaSet needs 3 replicas                            │
│  → Current pods: 0                                              │
│  → Creates 3 Pod objects in etcd                               │
│                                                                  │
│  Pods in etcd:                                                  │
│  { "name": "myapp-abc12", "node": null, "status": "Pending" }  │
│  { "name": "myapp-def34", "node": null, "status": "Pending" }  │
│  { "name": "myapp-ghi56", "node": null, "status": "Pending" }  │
│                                                                  │
│                                                                  │
│  STEP 4: Scheduler assigns Pods to Nodes                       │
│  ──────────────────────────────────────                        │
│                                                                  │
│  Scheduler watches for Pods with node = null                   │
│  → Finds 3 unscheduled pods                                     │
│                                                                  │
│  For each pod, Scheduler:                                       │
│                                                                  │
│  a) FILTERING: Which nodes CAN run this pod?                   │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ Node 1: Has 4GB free RAM, pod needs 2GB → ✓ PASS    │    │
│     │ Node 2: Has 1GB free RAM, pod needs 2GB → ✗ FAIL    │    │
│     │ Node 3: Has taint "gpu=true", pod has no tolerance  │    │
│     │         → ✗ FAIL                                     │    │
│     │ Node 4: Has 8GB free RAM → ✓ PASS                   │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  b) SCORING: Which passing node is BEST?                       │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ Node 1: Score = 60 (balanced resources)             │    │
│     │ Node 4: Score = 80 (more resources, same zone)      │    │
│     │                                                      │    │
│     │ Winner: Node 4                                       │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  c) BINDING: Update pod in etcd with node assignment           │
│     { "name": "myapp-abc12", "node": "node-4" }                │
│                                                                  │
│                                                                  │
│  STEP 5: Kubelet creates the container                         │
│  ────────────────────────────────────                          │
│                                                                  │
│  Kubelet on Node 4 watches for pods assigned to it             │
│  → Sees myapp-abc12 assigned                                   │
│  → Pulls image (if not cached)                                 │
│  → Creates container via containerd                            │
│  → Sets up networking (CNI)                                    │
│  → Mounts volumes                                              │
│  → Starts container                                            │
│  → Reports status: "Running"                                   │
│                                                                  │
│                                                                  │
│  TOTAL TIME: 2-30 seconds (depending on image pull)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Kubernetes Service Networking

```
HOW SERVICES ROUTE TRAFFIC:
══════════════════════════

Service: myapp-service (ClusterIP: 10.96.45.123, Port: 80)
Pods: myapp-abc (10.244.1.5:8080), myapp-def (10.244.2.8:8080)

┌─────────────────────────────────────────────────────────────────┐
│              SERVICE NETWORKING                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client Pod sends request:                                      │
│  curl http://myapp-service:80/api/users                        │
│                                                                  │
│  STEP 1: DNS RESOLUTION                                         │
│  ─────────────────────────                                      │
│                                                                  │
│  CoreDNS (cluster DNS):                                        │
│  myapp-service.default.svc.cluster.local → 10.96.45.123        │
│                                                                  │
│                                                                  │
│  STEP 2: IPTABLES/IPVS RULES (kube-proxy)                      │
│  ─────────────────────────────────────────                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 IPTABLES RULES                           │   │
│  │                 (on every node)                          │   │
│  │                                                          │   │
│  │  RULE: If destination = 10.96.45.123:80                 │   │
│  │        → DNAT to one of:                                 │   │
│  │           - 10.244.1.5:8080 (50% probability)           │   │
│  │           - 10.244.2.8:8080 (50% probability)           │   │
│  │                                                          │   │
│  │  This is random load balancing!                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  STEP 3: PACKET ROUTING                                         │
│  ───────────────────────                                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  Client Pod ──► 10.96.45.123:80 (Service IP)            │   │
│  │       │                                                  │   │
│  │       │ iptables DNAT                                   │   │
│  │       ▼                                                  │   │
│  │  10.244.2.8:8080 (Pod IP - selected randomly)           │   │
│  │       │                                                  │   │
│  │       │ If pod on same node: direct delivery            │   │
│  │       │ If pod on different node: route via overlay     │   │
│  │       ▼                                                  │   │
│  │  myapp-def Pod receives request                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                                                                  │
│  SERVICE TYPES:                                                  │
│  ─────────────                                                  │
│                                                                  │
│  ClusterIP (default):                                           │
│  • Internal cluster IP only                                    │
│  • Not accessible from outside                                 │
│                                                                  │
│  NodePort:                                                       │
│  • Exposes on each node's IP at static port (30000-32767)     │
│  • curl http://node-ip:30123                                   │
│                                                                  │
│  LoadBalancer:                                                   │
│  • Creates cloud load balancer (AWS ELB, GCP LB)               │
│  • Gets external IP                                            │
│                                                                  │
│  Ingress:                                                        │
│  • HTTP/HTTPS routing                                          │
│  • Path-based routing (/api → service1, /web → service2)       │
│  • TLS termination                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 9: Monitoring & Observability

### The Three Pillars

```
┌─────────────────────────────────────────────────────────────────┐
│              OBSERVABILITY - THREE PILLARS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   METRICS   │    │    LOGS     │    │   TRACES    │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                  │
│  WHAT happened?     WHY it happened?   WHERE it happened?       │
│                                                                  │
│  Numbers over time  Text events        Request journey          │
│  CPU, Memory, QPS   Errors, Debug      Across services          │
│  Aggregatable       Searchable         Distributed              │
│                                                                  │
│  Tools:             Tools:             Tools:                   │
│  Prometheus         ELK Stack          Jaeger                   │
│  Grafana            Loki               Zipkin                   │
│  Datadog            Splunk             AWS X-Ray                │
│                                                                  │
│  Example:           Example:           Example:                 │
│  HTTP 500 rate      Stack trace        Request: UserSvc →       │
│  increased 50%      NullPointer        OrderSvc → PaymentSvc    │
│  at 3:45 PM         at UserService     latency breakdown        │
│                     line 127                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prometheus + Grafana Setup

```yaml
# prometheus.yml - Prometheus Configuration
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]

rule_files:
  - /etc/prometheus/alerts/*.yml

scrape_configs:
  # Prometheus itself
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # Spring Boot apps (via Actuator)
  - job_name: "spring-boot"
    metrics_path: "/actuator/prometheus"
    static_configs:
      - targets: ["backend:8080"]
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance

  # Node Exporter (OS metrics)
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  # Kubernetes pods (auto-discovery)
  - job_name: "kubernetes-pods"
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

---
# alerts.yml - Alert Rules
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) 
          / sum(rate(http_server_requests_seconds_count[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, 
            sum(rate(http_server_requests_seconds_bucket[5m])) by (le)
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "95th percentile latency is {{ $value }}s"

      - alert: PodCrashLooping
        expr: |
          increase(kube_pod_container_status_restarts_total[1h]) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod is crash looping"
          description: "Pod {{ $labels.pod }} restarted {{ $value }} times"

      - alert: HighMemoryUsage
        expr: |
          (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Container using {{ $value | humanizePercentage }} of memory limit"
```

```java
// Spring Boot Metrics Configuration
@Configuration
public class MetricsConfig {

    @Bean
    MeterRegistryCustomizer<MeterRegistry> commonTags() {
        return registry -> registry.config()
            .commonTags("application", "my-app")
            .commonTags("environment", System.getenv("ENV"));
    }
}

// Custom business metrics
@Service
@RequiredArgsConstructor
public class OrderService {

    private final MeterRegistry meterRegistry;
    private final Counter orderCounter;
    private final Timer orderProcessingTimer;

    @PostConstruct
    void initMetrics() {
        orderCounter = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("type", "all")
            .register(meterRegistry);

        orderProcessingTimer = Timer.builder("orders.processing.time")
            .description("Order processing duration")
            .publishPercentiles(0.5, 0.95, 0.99)
            .register(meterRegistry);
    }

    public Order createOrder(OrderRequest request) {
        return orderProcessingTimer.record(() -> {
            // Process order
            Order order = processOrder(request);

            orderCounter.increment();

            // Track by payment method
            meterRegistry.counter("orders.created",
                "payment_method", request.getPaymentMethod()
            ).increment();

            return order;
        });
    }
}
```

### ELK Stack - Logging

```yaml
# docker-compose.yml - ELK Stack
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:

---
# logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }

  # Direct from application
  tcp {
    port => 5000
    codec => json_lines
  }
}

filter {
  if [message] =~ /^\{/ {
    json {
      source => "message"
    }
  }

  # Parse timestamp
  date {
    match => ["timestamp", "ISO8601", "yyyy-MM-dd HH:mm:ss.SSS"]
    target => "@timestamp"
  }

  # Add geo info from IP
  geoip {
    source => "client_ip"
  }

  # Parse user agent
  useragent {
    source => "user_agent"
    target => "user_agent_parsed"
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{[application]}-%{+YYYY.MM.dd}"
  }
}
```

```xml
<!-- logback-spring.xml - Structured Logging -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- Console output for development -->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <!-- JSON output for production (ELK) -->
    <springProfile name="prod">
        <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
            <destination>logstash:5000</destination>
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <customFields>{"application":"my-app","environment":"production"}</customFields>
                <includeMdcKeyName>traceId</includeMdcKeyName>
                <includeMdcKeyName>spanId</includeMdcKeyName>
                <includeMdcKeyName>userId</includeMdcKeyName>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="LOGSTASH"/>
        </root>
    </springProfile>
</configuration>
```

### Distributed Tracing with Jaeger

```java
// Spring Boot with Micrometer Tracing + Jaeger
// application.yml
management:
  tracing:
    sampling:
      probability: 1.0  # 100% sampling in dev, reduce in prod
  zipkin:
    tracing:
      endpoint: http://jaeger:9411/api/v2/spans

// Propagate trace context in REST calls
@Configuration
public class RestClientConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.build();
    }
}

// Trace context automatically propagated via headers:
// traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01

// Custom spans for business operations
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final Tracer tracer;

    public PaymentResult processPayment(PaymentRequest request) {
        Span span = tracer.nextSpan().name("process-payment").start();

        try (Tracer.SpanInScope ws = tracer.withSpan(span)) {
            // Add business context to span
            span.tag("payment.method", request.getMethod());
            span.tag("payment.amount", String.valueOf(request.getAmount()));

            // Process payment
            PaymentResult result = doProcess(request);

            span.tag("payment.status", result.getStatus());
            return result;

        } catch (Exception e) {
            span.error(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

```
DISTRIBUTED TRACE EXAMPLE:
──────────────────────────

Request: POST /api/orders

Trace ID: abc123

├── API Gateway (2ms)
│   └── Auth check
│
├── Order Service (150ms)
│   ├── Validate request (5ms)
│   ├── Check inventory (50ms) ────────────────┐
│   │                                          │
│   │   Inventory Service (45ms)              │
│   │   └── Query database (40ms)             │
│   │                                          │
│   ├── Process payment (80ms) ────────────────┤
│   │                                          │
│   │   Payment Service (75ms)                │
│   │   ├── Fraud check (30ms)                │
│   │   └── Charge card (40ms)                │
│   │                                          │
│   └── Create order (15ms)                   │
│       └── Save to DB (10ms)                 │
│
└── Send confirmation email (async)
    └── Email Service (200ms)
```

---

_Stage 4 Complete! Ready for Stage 5: Complete Application Scenarios_

---

## Phase 10: Complete Application Scenarios

### Scenario 1: Finance Application (Banking/Fintech)

```
┌─────────────────────────────────────────────────────────────────┐
│            BANKING APPLICATION - COMPLETE ARCHITECTURE           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     ┌─────────────────┐                         │
│   Mobile App ──────►│   API Gateway   │◄────── Web App          │
│                     │  (Kong/AWS)     │                         │
│                     └────────┬────────┘                         │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           │                  │                  │               │
│           ▼                  ▼                  ▼               │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │    Auth       │  │   Account     │  │  Transaction  │      │
│   │   Service     │  │   Service     │  │   Service     │      │
│   │               │  │               │  │               │      │
│   │ - Login/MFA   │  │ - Balance     │  │ - Transfer    │      │
│   │ - JWT/OAuth   │  │ - Statement   │  │ - Payment     │      │
│   │ - Session     │  │ - KYC         │  │ - History     │      │
│   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘      │
│           │                  │                  │               │
│           ▼                  ▼                  ▼               │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │    Redis      │  │  PostgreSQL   │  │  PostgreSQL   │      │
│   │  (Sessions)   │  │  (Accounts)   │  │  (Ledger)     │      │
│   └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│   ADDITIONAL SERVICES:                                          │
│   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│   │   Fraud       │  │ Notification  │  │   Reporting   │      │
│   │  Detection    │  │   Service     │  │   Service     │      │
│   │  (ML Model)   │  │ (Email/SMS)   │  │  (Analytics)  │      │
│   └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                  │
│   EVENT STREAMING:                                              │
│   ┌─────────────────────────────────────────────────────┐      │
│   │                    Apache Kafka                      │      │
│   │  Topics: transactions, audit-log, notifications     │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Transaction Service - Double Entry Ledger

```java
// CRITICAL: Banking transactions use double-entry bookkeeping
// Every transaction has TWO entries: Debit and Credit

@Entity
@Table(name = "ledger_entries")
public class LedgerEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String transactionId;  // Groups related entries

    @Column(nullable = false)
    private String accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType entryType;  // DEBIT or CREDIT

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String description;
    private String referenceNumber;
}

@Service
@RequiredArgsConstructor
@Transactional
public class TransferService {

    private final AccountRepository accountRepository;
    private final LedgerRepository ledgerRepository;
    private final KafkaTemplate<String, TransactionEvent> kafkaTemplate;
    private final FraudDetectionService fraudService;

    public TransferResult transfer(TransferRequest request) {
        String transactionId = UUID.randomUUID().toString();

        // 1. Validate accounts exist
        Account fromAccount = accountRepository.findById(request.getFromAccountId())
            .orElseThrow(() -> new AccountNotFoundException(request.getFromAccountId()));
        Account toAccount = accountRepository.findById(request.getToAccountId())
            .orElseThrow(() -> new AccountNotFoundException(request.getToAccountId()));

        // 2. Check sufficient balance
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new InsufficientFundsException(fromAccount.getId());
        }

        // 3. Fraud check (async but wait for critical transactions)
        FraudCheckResult fraudResult = fraudService.check(request);
        if (fraudResult.isBlocked()) {
            throw new TransactionBlockedException("Fraud detected: " + fraudResult.getReason());
        }

        // 4. Create ledger entries (DOUBLE ENTRY)
        LocalDateTime now = LocalDateTime.now();

        // Debit from source account
        LedgerEntry debitEntry = LedgerEntry.builder()
            .transactionId(transactionId)
            .accountId(fromAccount.getId())
            .entryType(EntryType.DEBIT)
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .timestamp(now)
            .description("Transfer to " + toAccount.getAccountNumber())
            .build();

        // Credit to destination account
        LedgerEntry creditEntry = LedgerEntry.builder()
            .transactionId(transactionId)
            .accountId(toAccount.getId())
            .entryType(EntryType.CREDIT)
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .timestamp(now)
            .description("Transfer from " + fromAccount.getAccountNumber())
            .build();

        // 5. Update account balances
        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));

        // 6. Save all (atomic transaction)
        ledgerRepository.saveAll(List.of(debitEntry, creditEntry));
        accountRepository.saveAll(List.of(fromAccount, toAccount));

        // 7. Publish event for audit and notifications
        kafkaTemplate.send("transactions", transactionId,
            new TransactionEvent(transactionId, request, TransactionStatus.COMPLETED));

        return new TransferResult(transactionId, TransactionStatus.COMPLETED);
    }
}

// Idempotency for payment APIs (prevent double-charge)
@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final RedisTemplate<String, String> redis;

    @PostMapping
    public ResponseEntity<PaymentResponse> processPayment(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody PaymentRequest request) {

        // Check if already processed
        String existingResult = redis.opsForValue().get("payment:" + idempotencyKey);
        if (existingResult != null) {
            return ResponseEntity.ok(parseResponse(existingResult));
        }

        // Process payment
        PaymentResponse response = paymentService.process(request);

        // Store result with TTL (24 hours)
        redis.opsForValue().set(
            "payment:" + idempotencyKey,
            serializeResponse(response),
            Duration.ofHours(24)
        );

        return ResponseEntity.ok(response);
    }
}
```

#### Financial Calculations - Precision Matters

```java
// NEVER use float/double for money! Use BigDecimal

public class FinancialCalculations {

    // Interest calculation
    public static BigDecimal calculateSimpleInterest(
            BigDecimal principal,
            BigDecimal annualRate,
            int days) {
        // Interest = P × R × T
        return principal
            .multiply(annualRate)
            .multiply(BigDecimal.valueOf(days))
            .divide(BigDecimal.valueOf(365), 4, RoundingMode.HALF_UP);
    }

    // Compound interest
    public static BigDecimal calculateCompoundInterest(
            BigDecimal principal,
            BigDecimal annualRate,
            int timesPerYear,
            int years) {
        // A = P(1 + r/n)^(nt)
        BigDecimal rate = annualRate.divide(BigDecimal.valueOf(timesPerYear), 10, RoundingMode.HALF_UP);
        BigDecimal base = BigDecimal.ONE.add(rate);
        int exponent = timesPerYear * years;

        BigDecimal multiplier = base.pow(exponent);
        return principal.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
    }

    // EMI (Equated Monthly Installment) calculation
    public static BigDecimal calculateEMI(
            BigDecimal principal,
            BigDecimal annualRate,
            int tenureMonths) {
        // EMI = [P × R × (1+R)^N] / [(1+R)^N – 1]
        BigDecimal monthlyRate = annualRate
            .divide(BigDecimal.valueOf(12), 10, RoundingMode.HALF_UP)
            .divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP);

        BigDecimal onePlusR = BigDecimal.ONE.add(monthlyRate);
        BigDecimal power = onePlusR.pow(tenureMonths);

        BigDecimal numerator = principal.multiply(monthlyRate).multiply(power);
        BigDecimal denominator = power.subtract(BigDecimal.ONE);

        return numerator.divide(denominator, 2, RoundingMode.HALF_UP);
    }

    // Currency conversion with rate
    public static BigDecimal convert(
            BigDecimal amount,
            BigDecimal exchangeRate,
            int targetScale) {
        return amount.multiply(exchangeRate)
            .setScale(targetScale, RoundingMode.HALF_UP);
    }
}
```

---

### Scenario 2: E-Commerce Platform

```
┌─────────────────────────────────────────────────────────────────┐
│              E-COMMERCE PLATFORM ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         ┌──────────────┐                        │
│                         │   CDN        │                        │
│                         │ (CloudFront) │                        │
│                         └──────┬───────┘                        │
│                                │                                 │
│   ┌────────────────────────────┼────────────────────────────┐   │
│   │                            │                            │   │
│   ▼                            ▼                            ▼   │
│ ┌──────────┐            ┌──────────────┐            ┌──────────┐│
│ │  React   │            │  API Gateway │            │  Admin   ││
│ │   SPA    │            │              │            │  Portal  ││
│ └──────────┘            └──────┬───────┘            └──────────┘│
│                                │                                 │
│        ┌───────────────────────┼───────────────────────┐        │
│        │           │           │           │           │        │
│        ▼           ▼           ▼           ▼           ▼        │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │ Product │ │  Cart   │ │  Order  │ │ Payment │ │ Search  │  │
│   │ Service │ │ Service │ │ Service │ │ Service │ │ Service │  │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│        │           │           │           │           │        │
│        ▼           ▼           ▼           ▼           ▼        │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│   │PostgreSQL│ │  Redis  │ │PostgreSQL│ │ Stripe │ │Elastic- │  │
│   │(Products)│ │ (Cart)  │ │(Orders) │ │  API   │ │ search  │  │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                                  │
│   ADDITIONAL:                                                   │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │Inventory│ │Shipping │ │  Email  │ │Analytics│              │
│   │ Service │ │ Service │ │ Service │ │ Service │              │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                  │
│   MESSAGE QUEUE (Async operations):                             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                      RabbitMQ / SQS                      │  │
│   │  Queues: order-processing, inventory-updates, emails    │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Cart Service with Redis

```java
// Cart stored in Redis for fast access and auto-expiry
@Service
@RequiredArgsConstructor
public class CartService {

    private final RedisTemplate<String, Cart> redisTemplate;
    private final ProductService productService;

    private static final String CART_PREFIX = "cart:";
    private static final Duration CART_TTL = Duration.ofDays(7);

    public Cart getCart(String userId) {
        Cart cart = redisTemplate.opsForValue().get(CART_PREFIX + userId);
        return cart != null ? cart : new Cart(userId);
    }

    public Cart addItem(String userId, AddToCartRequest request) {
        Cart cart = getCart(userId);

        // Validate product exists and has stock
        Product product = productService.getProduct(request.getProductId());
        if (product.getStock() < request.getQuantity()) {
            throw new InsufficientStockException(product.getId());
        }

        // Add or update item
        cart.addItem(CartItem.builder()
            .productId(product.getId())
            .productName(product.getName())
            .price(product.getPrice())
            .quantity(request.getQuantity())
            .imageUrl(product.getImageUrl())
            .build());

        // Recalculate totals
        cart.recalculate();

        // Save with TTL refresh
        redisTemplate.opsForValue().set(CART_PREFIX + userId, cart, CART_TTL);

        return cart;
    }

    public Cart removeItem(String userId, String productId) {
        Cart cart = getCart(userId);
        cart.removeItem(productId);
        cart.recalculate();
        redisTemplate.opsForValue().set(CART_PREFIX + userId, cart, CART_TTL);
        return cart;
    }

    public void clearCart(String userId) {
        redisTemplate.delete(CART_PREFIX + userId);
    }
}

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cart implements Serializable {
    private String userId;
    private List<CartItem> items = new ArrayList<>();
    private BigDecimal subtotal = BigDecimal.ZERO;
    private BigDecimal tax = BigDecimal.ZERO;
    private BigDecimal shipping = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
    private String couponCode;
    private BigDecimal discount = BigDecimal.ZERO;

    public Cart(String userId) {
        this.userId = userId;
    }

    public void addItem(CartItem newItem) {
        Optional<CartItem> existing = items.stream()
            .filter(item -> item.getProductId().equals(newItem.getProductId()))
            .findFirst();

        if (existing.isPresent()) {
            existing.get().setQuantity(
                existing.get().getQuantity() + newItem.getQuantity());
        } else {
            items.add(newItem);
        }
    }

    public void recalculate() {
        subtotal = items.stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        tax = subtotal.multiply(new BigDecimal("0.18")); // 18% GST
        shipping = subtotal.compareTo(new BigDecimal("500")) >= 0
            ? BigDecimal.ZERO
            : new BigDecimal("50");

        total = subtotal.add(tax).add(shipping).subtract(discount);
    }
}
```

#### Order Saga Pattern (Distributed Transaction)

```java
// Saga pattern for order processing across multiple services
// Each step has a compensating action for rollback

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSagaOrchestrator {

    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final ShippingService shippingService;
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderResult createOrder(CreateOrderRequest request) {
        Order order = Order.builder()
            .userId(request.getUserId())
            .items(request.getItems())
            .status(OrderStatus.PENDING)
            .build();
        order = orderRepository.save(order);

        String orderId = order.getId();
        List<SagaStep> completedSteps = new ArrayList<>();

        try {
            // Step 1: Reserve inventory
            log.info("Order {}: Reserving inventory", orderId);
            inventoryService.reserve(orderId, request.getItems());
            completedSteps.add(SagaStep.INVENTORY_RESERVED);

            // Step 2: Process payment
            log.info("Order {}: Processing payment", orderId);
            PaymentResult payment = paymentService.charge(
                orderId, request.getPaymentMethod(), request.getTotal());
            completedSteps.add(SagaStep.PAYMENT_PROCESSED);

            // Step 3: Create shipment
            log.info("Order {}: Creating shipment", orderId);
            ShipmentResult shipment = shippingService.createShipment(
                orderId, request.getShippingAddress());
            completedSteps.add(SagaStep.SHIPMENT_CREATED);

            // All steps successful - update order
            order.setStatus(OrderStatus.CONFIRMED);
            order.setPaymentId(payment.getPaymentId());
            order.setTrackingNumber(shipment.getTrackingNumber());
            orderRepository.save(order);

            // Step 4: Send confirmation (async, non-critical)
            notificationService.sendOrderConfirmation(order);

            log.info("Order {} completed successfully", orderId);
            return new OrderResult(orderId, OrderStatus.CONFIRMED);

        } catch (Exception e) {
            log.error("Order {} failed, initiating compensation", orderId, e);
            compensate(orderId, completedSteps);

            order.setStatus(OrderStatus.FAILED);
            order.setFailureReason(e.getMessage());
            orderRepository.save(order);

            throw new OrderProcessingException("Order failed: " + e.getMessage(), e);
        }
    }

    private void compensate(String orderId, List<SagaStep> completedSteps) {
        // Reverse order - undo steps in reverse
        Collections.reverse(completedSteps);

        for (SagaStep step : completedSteps) {
            try {
                switch (step) {
                    case SHIPMENT_CREATED:
                        log.info("Compensating: Cancelling shipment for {}", orderId);
                        shippingService.cancelShipment(orderId);
                        break;
                    case PAYMENT_PROCESSED:
                        log.info("Compensating: Refunding payment for {}", orderId);
                        paymentService.refund(orderId);
                        break;
                    case INVENTORY_RESERVED:
                        log.info("Compensating: Releasing inventory for {}", orderId);
                        inventoryService.release(orderId);
                        break;
                }
            } catch (Exception e) {
                log.error("Compensation failed for step {} order {}", step, orderId, e);
                // Log for manual intervention
            }
        }
    }

    enum SagaStep {
        INVENTORY_RESERVED,
        PAYMENT_PROCESSED,
        SHIPMENT_CREATED
    }
}
```

#### Search with Elasticsearch

```java
// Product search using Elasticsearch
@Service
@RequiredArgsConstructor
public class ProductSearchService {

    private final ElasticsearchClient esClient;

    public SearchResult<Product> search(ProductSearchRequest request) {
        SearchResponse<Product> response = esClient.search(s -> s
            .index("products")
            .query(q -> q
                .bool(b -> {
                    // Full-text search on name and description
                    if (request.getQuery() != null) {
                        b.must(m -> m
                            .multiMatch(mm -> mm
                                .query(request.getQuery())
                                .fields("name^3", "description", "brand^2")
                                .fuzziness("AUTO")
                            )
                        );
                    }

                    // Category filter
                    if (request.getCategory() != null) {
                        b.filter(f -> f
                            .term(t -> t.field("category").value(request.getCategory()))
                        );
                    }

                    // Price range
                    if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                        b.filter(f -> f
                            .range(r -> {
                                r.field("price");
                                if (request.getMinPrice() != null) {
                                    r.gte(JsonData.of(request.getMinPrice()));
                                }
                                if (request.getMaxPrice() != null) {
                                    r.lte(JsonData.of(request.getMaxPrice()));
                                }
                                return r;
                            })
                        );
                    }

                    // Only in-stock products
                    if (request.isInStockOnly()) {
                        b.filter(f -> f
                            .range(r -> r.field("stock").gt(JsonData.of(0)))
                        );
                    }

                    return b;
                })
            )
            .sort(getSortOptions(request.getSortBy()))
            .from(request.getPage() * request.getSize())
            .size(request.getSize())
            .aggregations("categories", a -> a
                .terms(t -> t.field("category").size(20))
            )
            .aggregations("price_ranges", a -> a
                .range(r -> r
                    .field("price")
                    .ranges(
                        range -> range.to(100.0).key("Under ₹100"),
                        range -> range.from(100.0).to(500.0).key("₹100 - ₹500"),
                        range -> range.from(500.0).to(1000.0).key("₹500 - ₹1000"),
                        range -> range.from(1000.0).key("Over ₹1000")
                    )
                )
            )
            .highlight(h -> h
                .fields("name", f -> f)
                .fields("description", f -> f)
            ),
            Product.class
        );

        return buildSearchResult(response, request);
    }

    // Autocomplete suggestions
    public List<String> suggest(String prefix) {
        SearchResponse<Void> response = esClient.search(s -> s
            .index("products")
            .suggest(su -> su
                .suggesters("product-suggest", sg -> sg
                    .prefix(prefix)
                    .completion(c -> c
                        .field("name.suggest")
                        .size(10)
                        .skipDuplicates(true)
                    )
                )
            ),
            Void.class
        );

        return response.suggest().get("product-suggest").stream()
            .flatMap(s -> s.completion().options().stream())
            .map(o -> o.text())
            .collect(Collectors.toList());
    }
}
```

---

### Scenario 3: Real-Time Chat Application

```
┌─────────────────────────────────────────────────────────────────┐
│               REAL-TIME CHAT ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌────────────┐     ┌────────────┐     ┌────────────┐         │
│   │  Client 1  │     │  Client 2  │     │  Client N  │         │
│   │  (React)   │     │  (Mobile)  │     │  (Web)     │         │
│   └─────┬──────┘     └─────┬──────┘     └─────┬──────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                     │
│                    WebSocket Connection                          │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │ Load Balancer │                            │
│                    │ (Sticky/WS)   │                            │
│                    └───────┬───────┘                            │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                 │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐            │
│   │  Chat     │     │  Chat     │     │  Chat     │            │
│   │ Server 1  │◄───►│ Server 2  │◄───►│ Server 3  │            │
│   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘            │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│                    ┌──────▼──────┐                              │
│                    │    Redis    │  Pub/Sub for cross-server   │
│                    │   Pub/Sub   │  message delivery           │
│                    └──────┬──────┘                              │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│   ┌─────▼─────┐    ┌──────▼──────┐   ┌──────▼──────┐           │
│   │  MongoDB  │    │   Redis     │   │   S3/CDN   │           │
│   │ Messages  │    │  Presence   │   │  Media     │           │
│   │ History   │    │  Online/    │   │  Files     │           │
│   └───────────┘    │  Typing     │   └────────────┘           │
│                    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### WebSocket Chat Server (Node.js/Socket.io)

```typescript
// server.ts - Chat server with Socket.io
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import jwt from "jsonwebtoken";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Redis adapter for multi-server support
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    socket.data.userId = decoded.userId;
    socket.data.username = decoded.username;
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

// Connection handler
io.on("connection", (socket: Socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId}`);

  // Join user's personal room (for direct messages)
  socket.join(`user:${userId}`);

  // Update online status
  pubClient.hSet(
    "online_users",
    userId,
    JSON.stringify({
      socketId: socket.id,
      lastSeen: new Date().toISOString(),
    }),
  );

  // Notify friends user is online
  broadcastPresence(userId, "online");

  // Join chat room
  socket.on("join_room", async (roomId: string) => {
    // Verify user has access to room
    const hasAccess = await verifyRoomAccess(userId, roomId);
    if (!hasAccess) {
      socket.emit("error", { message: "Access denied" });
      return;
    }

    socket.join(`room:${roomId}`);

    // Load recent messages
    const messages = await loadRecentMessages(roomId, 50);
    socket.emit("room_history", { roomId, messages });

    // Notify room
    socket.to(`room:${roomId}`).emit("user_joined", {
      userId,
      username: socket.data.username,
      roomId,
    });
  });

  // Send message
  socket.on(
    "send_message",
    async (data: {
      roomId: string;
      content: string;
      type: "text" | "image" | "file";
      replyTo?: string;
    }) => {
      const message = {
        id: generateId(),
        roomId: data.roomId,
        senderId: userId,
        senderName: socket.data.username,
        content: data.content,
        type: data.type,
        replyTo: data.replyTo,
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      // Save to database
      await saveMessage(message);

      // Broadcast to room (including sender for confirmation)
      io.to(`room:${data.roomId}`).emit("new_message", message);
    },
  );

  // Typing indicator
  socket.on("typing_start", (roomId: string) => {
    socket.to(`room:${roomId}`).emit("user_typing", {
      userId,
      username: socket.data.username,
      roomId,
    });
  });

  socket.on("typing_stop", (roomId: string) => {
    socket.to(`room:${roomId}`).emit("user_stopped_typing", {
      userId,
      roomId,
    });
  });

  // Direct message
  socket.on(
    "direct_message",
    async (data: { recipientId: string; content: string }) => {
      const message = {
        id: generateId(),
        senderId: userId,
        recipientId: data.recipientId,
        content: data.content,
        timestamp: new Date().toISOString(),
        read: false,
      };

      await saveDirectMessage(message);

      // Send to recipient (if online)
      io.to(`user:${data.recipientId}`).emit("direct_message", message);

      // Confirm to sender
      socket.emit("message_sent", { messageId: message.id });
    },
  );

  // Message read receipt
  socket.on(
    "message_read",
    async (data: { messageId: string; roomId: string }) => {
      await markMessageRead(data.messageId, userId);

      io.to(`room:${data.roomId}`).emit("message_read_receipt", {
        messageId: data.messageId,
        readBy: userId,
        readAt: new Date().toISOString(),
      });
    },
  );

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);

    // Update last seen
    pubClient.hSet(
      "online_users",
      userId,
      JSON.stringify({
        socketId: null,
        lastSeen: new Date().toISOString(),
      }),
    );

    broadcastPresence(userId, "offline");
  });
});

// React client hook
// useChat.ts
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export function useChat(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ["websocket"],
    });

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("room_history", ({ messages }) => {
      setMessages(messages);
    });

    newSocket.on("user_typing", ({ userId, username }) => {
      setTypingUsers((prev) => new Map(prev).set(userId, username));
    });

    newSocket.on("user_stopped_typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);
    return () => {
      newSocket.close();
    };
  }, [token]);

  const sendMessage = useCallback(
    (roomId: string, content: string) => {
      socket?.emit("send_message", { roomId, content, type: "text" });
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      socket?.emit("join_room", roomId);
    },
    [socket],
  );

  return { connected, messages, typingUsers, sendMessage, joinRoom };
}
```

---

### Scenario 4: Distributed System Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│              DISTRIBUTED SYSTEM PATTERNS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. CIRCUIT BREAKER PATTERN                                     │
│  ──────────────────────────                                     │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │    CLOSED ────────► OPEN ────────► HALF-OPEN            │   │
│   │      ▲                               │                   │   │
│   │      │                               │                   │   │
│   │      └───────────────────────────────┘                   │   │
│   │                                                          │   │
│   │  CLOSED: Normal operation, requests pass through        │   │
│   │  OPEN: Failures exceeded threshold, fail fast           │   │
│   │  HALF-OPEN: Test if service recovered                   │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  2. RETRY PATTERN WITH EXPONENTIAL BACKOFF                      │
│  ─────────────────────────────────────────                      │
│                                                                  │
│   Attempt 1: Immediate                                          │
│   Attempt 2: Wait 1 second                                      │
│   Attempt 3: Wait 2 seconds                                     │
│   Attempt 4: Wait 4 seconds                                     │
│   Attempt 5: Wait 8 seconds (with jitter)                       │
│                                                                  │
│  3. BULKHEAD PATTERN                                            │
│  ───────────────────                                            │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Service A         Service B         Service C          │   │
│   │  ┌─────────┐       ┌─────────┐       ┌─────────┐       │   │
│   │  │ Pool: 10│       │ Pool: 20│       │ Pool: 5 │       │   │
│   │  │ threads │       │ threads │       │ threads │       │   │
│   │  └─────────┘       └─────────┘       └─────────┘       │   │
│   │                                                          │   │
│   │  If Service A fails, B and C continue unaffected        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Resilience4j Implementation

```java
// Circuit Breaker + Retry + Bulkhead + Rate Limiter
@Configuration
public class ResilienceConfig {

    @Bean
    public CircuitBreakerConfig circuitBreakerConfig() {
        return CircuitBreakerConfig.custom()
            .failureRateThreshold(50)                // Open after 50% failures
            .waitDurationInOpenState(Duration.ofSeconds(30))
            .permittedNumberOfCallsInHalfOpenState(5)
            .minimumNumberOfCalls(10)
            .slidingWindowType(SlidingWindowType.COUNT_BASED)
            .slidingWindowSize(20)
            .build();
    }

    @Bean
    public RetryConfig retryConfig() {
        return RetryConfig.custom()
            .maxAttempts(3)
            .waitDuration(Duration.ofMillis(500))
            .exponentialBackoffMultiplier(2)
            .retryExceptions(IOException.class, TimeoutException.class)
            .ignoreExceptions(BusinessException.class)
            .build();
    }

    @Bean
    public BulkheadConfig bulkheadConfig() {
        return BulkheadConfig.custom()
            .maxConcurrentCalls(25)
            .maxWaitDuration(Duration.ofMillis(500))
            .build();
    }

    @Bean
    public RateLimiterConfig rateLimiterConfig() {
        return RateLimiterConfig.custom()
            .limitForPeriod(100)
            .limitRefreshPeriod(Duration.ofSeconds(1))
            .timeoutDuration(Duration.ofMillis(100))
            .build();
    }
}

@Service
@RequiredArgsConstructor
public class ExternalApiService {

    private final RestTemplate restTemplate;
    private final CircuitBreaker circuitBreaker;
    private final Retry retry;
    private final Bulkhead bulkhead;
    private final RateLimiter rateLimiter;

    public ApiResponse callExternalApi(ApiRequest request) {
        // Compose resilience patterns
        Supplier<ApiResponse> decoratedSupplier = Decorators
            .ofSupplier(() -> doApiCall(request))
            .withCircuitBreaker(circuitBreaker)
            .withRetry(retry)
            .withBulkhead(bulkhead)
            .withRateLimiter(rateLimiter)
            .withFallback(Arrays.asList(
                CallNotPermittedException.class,
                BulkheadFullException.class,
                RequestNotPermitted.class
            ), this::fallbackResponse)
            .decorate();

        return Try.ofSupplier(decoratedSupplier)
            .recover(throwable -> fallbackResponse(throwable))
            .get();
    }

    private ApiResponse doApiCall(ApiRequest request) {
        return restTemplate.postForObject(
            "https://external-api.com/endpoint",
            request,
            ApiResponse.class
        );
    }

    private ApiResponse fallbackResponse(Throwable t) {
        log.warn("Falling back due to: {}", t.getMessage());
        return ApiResponse.cached(); // Return cached or default response
    }
}

// Using annotations (simpler)
@Service
public class PaymentGatewayService {

    @CircuitBreaker(name = "paymentGateway", fallbackMethod = "paymentFallback")
    @Retry(name = "paymentGateway")
    @Bulkhead(name = "paymentGateway")
    public PaymentResponse processPayment(PaymentRequest request) {
        return paymentClient.charge(request);
    }

    private PaymentResponse paymentFallback(PaymentRequest request, Exception e) {
        log.error("Payment gateway unavailable", e);
        // Queue for later processing
        paymentQueue.enqueue(request);
        return PaymentResponse.pending("Payment queued for processing");
    }
}
```

#### Distributed Caching Strategy

```java
// Multi-level caching: Local (Caffeine) + Distributed (Redis)
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // L1 Cache: Local (fast, limited size)
        CaffeineCacheManager localCacheManager = new CaffeineCacheManager();
        localCacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(1000)
            .expireAfterWrite(Duration.ofMinutes(5)));

        // L2 Cache: Redis (shared, larger)
        RedisCacheConfiguration redisConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                    new GenericJackson2JsonRedisSerializer()));

        RedisCacheManager redisCacheManager = RedisCacheManager.builder(redisConnectionFactory)
            .cacheDefaults(redisConfig)
            .withCacheConfiguration("products",
                redisConfig.entryTtl(Duration.ofHours(1)))
            .withCacheConfiguration("users",
                redisConfig.entryTtl(Duration.ofMinutes(15)))
            .build();

        // Composite cache manager
        return new CompositeCacheManager(localCacheManager, redisCacheManager);
    }
}

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;
    private final CacheManager cacheManager;

    @Cacheable(value = "products", key = "#id")
    public Product getProduct(String id) {
        return repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));
    }

    @CachePut(value = "products", key = "#product.id")
    public Product updateProduct(Product product) {
        return repository.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(String id) {
        repository.deleteById(id);
    }

    // Cache aside pattern (manual control)
    public Product getProductWithCacheAside(String id) {
        Cache cache = cacheManager.getCache("products");

        // Try L1 cache first
        Product product = cache.get(id, Product.class);
        if (product != null) {
            return product;
        }

        // Cache miss - load from DB
        product = repository.findById(id)
            .orElseThrow(() -> new ProductNotFoundException(id));

        // Populate cache
        cache.put(id, product);

        return product;
    }
}
```

#### Event-Driven Architecture

```java
// Domain events with Spring + Kafka
public abstract class DomainEvent {
    private final String eventId = UUID.randomUUID().toString();
    private final Instant occurredOn = Instant.now();
    private final String aggregateId;

    public abstract String getEventType();
}

public class OrderCreatedEvent extends DomainEvent {
    private final String orderId;
    private final String userId;
    private final BigDecimal totalAmount;
    private final List<OrderItem> items;

    @Override
    public String getEventType() {
        return "ORDER_CREATED";
    }
}

// Event publisher
@Component
@RequiredArgsConstructor
public class DomainEventPublisher {

    private final KafkaTemplate<String, DomainEvent> kafkaTemplate;

    public void publish(DomainEvent event) {
        String topic = "domain-events." + event.getEventType().toLowerCase();

        kafkaTemplate.send(topic, event.getAggregateId(), event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("Failed to publish event: {}", event.getEventId(), ex);
                    // Store in outbox for retry
                    outboxRepository.save(new OutboxEntry(event));
                }
            });
    }
}

// Event consumer (different microservice)
@Component
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final InventoryService inventoryService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "domain-events.order_created", groupId = "inventory-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        log.info("Processing OrderCreatedEvent: {}", event.getEventId());

        try {
            // Update inventory
            inventoryService.decrementStock(event.getItems());
            log.info("Inventory updated for order: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to process order event", e);
            throw e; // Will trigger retry
        }
    }

    @KafkaListener(topics = "domain-events.order_created", groupId = "notification-service")
    public void sendOrderNotification(OrderCreatedEvent event) {
        // Each consumer group processes independently
        notificationService.sendOrderConfirmation(event.getUserId(), event.getOrderId());
    }
}

// Outbox pattern for reliable event publishing
@Entity
@Table(name = "outbox")
public class OutboxEntry {
    @Id
    private String id;
    private String eventType;
    private String aggregateId;

    @Column(columnDefinition = "jsonb")
    private String payload;

    private Instant createdAt;
    private Instant processedAt;
    private int retryCount;
    private String status; // PENDING, PROCESSED, FAILED
}

@Scheduled(fixedDelay = 5000)
@Transactional
public void processOutbox() {
    List<OutboxEntry> pending = outboxRepository
        .findByStatusAndRetryCountLessThan("PENDING", 5);

    for (OutboxEntry entry : pending) {
        try {
            kafkaTemplate.send(
                "domain-events." + entry.getEventType().toLowerCase(),
                entry.getAggregateId(),
                deserialize(entry.getPayload())
            ).get();

            entry.setStatus("PROCESSED");
            entry.setProcessedAt(Instant.now());
        } catch (Exception e) {
            entry.setRetryCount(entry.getRetryCount() + 1);
            if (entry.getRetryCount() >= 5) {
                entry.setStatus("FAILED");
            }
        }
        outboxRepository.save(entry);
    }
}
```

---

## 🔬 QUICK REFERENCE: Deep Internals Summary

```
┌─────────────────────────────────────────────────────────────────┐
│           ALL THE "HOW IT ACTUALLY WORKS" IN ONE PLACE          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🌐 NETWORKING - User Request Journey                           │
│  ───────────────────────────────────                            │
│  1. User types myapp.com                                        │
│  2. DNS Resolution → Get IP (54.23.167.89)                      │
│  3. TCP 3-way handshake (SYN → SYN-ACK → ACK)                  │
│  4. TLS Handshake (exchange keys, verify certificate)          │
│  5. HTTP Request sent (encrypted)                               │
│  6. Nginx (port 443) receives, decrypts                        │
│  7. Nginx reverse proxies to localhost:3000                    │
│  8. Your app processes request                                  │
│  9. Response travels back same path                            │
│                                                                  │
│  Key: Port 3000 not exposed! Nginx routes 443 → 3000          │
│                                                                  │
│                                                                  │
│  🖥️ OS - Process & Thread Internals                             │
│  ──────────────────────────────────                             │
│  Process = Running program with:                                │
│  • Virtual address space (Stack, Heap, Code, Data)             │
│  • PID, File descriptors, Registers                            │
│                                                                  │
│  Thread = Lightweight, shares process memory                    │
│  • Own: Stack (~1-8MB), Registers, Thread ID                   │
│  • Shared: Heap, Code, Files                                   │
│                                                                  │
│  100 threads × 8MB stack = 800MB RAM just for stacks!          │
│  → Use Thread Pools (reuse threads)                            │
│  → Or Event Loop (Node.js single thread)                       │
│                                                                  │
│                                                                  │
│  💾 DATABASE - Query Execution                                  │
│  ────────────────────────────                                   │
│  1. Parser → Tokenize → AST                                    │
│  2. Optimizer → Choose best execution plan                     │
│     (Index scan vs Full table scan)                            │
│  3. Executor → Run the plan                                    │
│  4. Storage Engine → B+ Tree index lookup O(log n)             │
│  5. Buffer Pool → Check RAM cache before disk                  │
│  6. Return Result                                               │
│                                                                  │
│  Key: Index = O(log n), Full scan = O(n)                       │
│  Millions of rows? Index = 20 comparisons, Scan = millions!    │
│                                                                  │
│                                                                  │
│  ☁️ CLOUD - Virtual Machine Internals                          │
│  ──────────────────────────────────                             │
│  Physical Server (96 cores, 768GB RAM)                         │
│       │                                                         │
│       ▼                                                         │
│  Hypervisor (AWS Nitro) divides resources                      │
│       │                                                         │
│  ┌────┴────┬────────┬────────┐                                 │
│  VM1       VM2       VM3                                        │
│  (Your EC2)                                                     │
│                                                                  │
│  EBS = Network-attached storage (not local disk!)              │
│  Load Balancer = Routes to healthy instances                   │
│  Auto Scaling = Add instances when CPU > 80%                   │
│                                                                  │
│                                                                  │
│  🐳 DOCKER - Container Internals                                │
│  ──────────────────────────────                                 │
│  Container ≠ VM                                                 │
│  Container = Process with isolation via:                       │
│  • Namespaces (what it sees)                                   │
│  • Cgroups (what it uses)                                      │
│                                                                  │
│  Image = Read-only layers (cached, reusable)                   │
│  Container Layer = Writable (deleted on stop)                  │
│                                                                  │
│  10 containers, same image = 1 copy of layers                  │
│                                                                  │
│                                                                  │
│  ⚙️ KUBERNETES - Pod Scheduling                                 │
│  ─────────────────────────────                                  │
│  1. kubectl apply → API Server → etcd                          │
│  2. Deployment Controller → Creates ReplicaSet                 │
│  3. ReplicaSet Controller → Creates Pods                       │
│  4. Scheduler → Assigns Pod to Node                            │
│     (Filter nodes, Score nodes, Bind)                          │
│  5. Kubelet on Node → Pulls image, Creates container           │
│                                                                  │
│  Service = Stable IP for dynamic Pods                          │
│  Ingress = HTTP routing (/api → svc1, /web → svc2)            │
│                                                                  │
│                                                                  │
│  🍃 SPRING BOOT - Request Lifecycle                             │
│  ──────────────────────────────────                             │
│  1. Tomcat thread picks up request                             │
│  2. Filter Chain (Security, CORS, etc.)                        │
│  3. DispatcherServlet → Handler Mapping                        │
│  4. Find Controller method                                      │
│  5. Argument Resolution (@PathVariable, @RequestBody)          │
│  6. YOUR CODE RUNS                                             │
│  7. Return Value Handling (JSON serialization)                 │
│  8. Response sent                                               │
│                                                                  │
│  @Transactional = Proxy wraps your method                      │
│  → BEGIN before, COMMIT/ROLLBACK after                         │
│                                                                  │
│                                                                  │
│  🎨 BROWSER - Rendering Pipeline                                │
│  ──────────────────────────────                                 │
│  HTML → DOM Tree                                               │
│  CSS  → CSSOM Tree                                             │
│  DOM + CSSOM → Render Tree                                     │
│  Layout → Calculate positions                                   │
│  Paint → Draw pixels                                           │
│  Composite → Send to GPU                                       │
│                                                                  │
│  transform animations = GPU only (fast)                        │
│  layout changes = Full pipeline (slow)                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary: Your Complete Learning Path

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR JOURNEY MAP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PHASE 1: DSA FOUNDATION (Month 1-2)                            │
│  ├── Arrays, Strings, Hashing                                   │
│  ├── Two Pointers, Sliding Window                               │
│  ├── Trees, Graphs, DP                                          │
│  └── ✅ See: 26_Ultimate_DataStructures_Algorithms_Guide.md     │
│                                                                  │
│  PHASE 2: SYSTEM DESIGN (Month 2-3)                             │
│  ├── Database Design & SQL                                      │
│  ├── API Design (REST, GraphQL)                                 │
│  ├── Scalability Patterns                                       │
│  └── ✅ Covered in this guide                                   │
│                                                                  │
│  PHASE 3: FULL-STACK (Month 3-4)                                │
│  ├── Frontend (React/Vue)                                       │
│  ├── Backend (Spring/Node)                                      │
│  ├── Database (SQL + NoSQL)                                     │
│  └── ✅ Covered in this guide                                   │
│                                                                  │
│  PHASE 4: CLOUD & DEVOPS (Month 4-5)                            │
│  ├── AWS/Azure Services                                         │
│  ├── Docker & Kubernetes                                        │
│  ├── CI/CD Pipelines                                            │
│  └── ✅ Covered in this guide                                   │
│                                                                  │
│  PHASE 5: DOMAIN EXPERTISE (Month 5-6)                          │
│  ├── Choose: Banking/Healthcare/E-commerce                      │
│  ├── Build complete projects                                    │
│  ├── Learn domain-specific patterns                             │
│  └── ✅ Scenarios covered in this guide                         │
│                                                                  │
│  PHASE 6: SOFT SKILLS (Ongoing)                                 │
│  ├── Communication                                              │
│  ├── Client Management                                          │
│  ├── Problem Solving                                            │
│  └── ✅ Covered in Part 2 (Freelancer Guide)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

PROJECTS TO BUILD:
──────────────────
1. Finance App: Expense tracker with bank sync
2. E-commerce: Full shopping platform
3. Chat App: Real-time messaging
4. Dashboard: Analytics with charts
5. API Gateway: Rate limiting, auth

CERTIFICATIONS TO CONSIDER:
───────────────────────────
□ AWS Solutions Architect Associate
□ Kubernetes Administrator (CKA)
□ Spring Professional
□ MongoDB Developer

DAILY PRACTICE:
───────────────
□ 2 DSA problems (LeetCode)
□ 30 min system design reading
□ 1 hour project building
□ 30 min cloud hands-on
```

---

## 🏁 Final Checklist: Are You Ready?

```
TECHNICAL SKILLS:
─────────────────
□ Can solve medium DSA problems in 30 mins
□ Can design database schema for any app
□ Can build REST API from scratch
□ Can containerize and deploy applications
□ Can set up CI/CD pipeline
□ Can debug distributed systems

SOFT SKILLS:
────────────
□ Can gather requirements from vague descriptions
□ Can estimate project timelines accurately
□ Can communicate technical concepts simply
□ Can handle client feedback professionally
□ Can prioritize tasks effectively

DOMAIN KNOWLEDGE:
─────────────────
□ Understand at least one domain deeply
□ Know compliance requirements (if applicable)
□ Familiar with industry-standard tools
□ Can speak the domain language

READY FOR:
──────────
□ Freelance projects
□ Senior developer interviews
□ Tech lead positions
□ System design interviews
□ Building your own products
```

---

**🎉 CONGRATULATIONS!**

You now have a complete guide covering:

- **Client Discovery** → How to ask the right questions
- **Requirements** → Turning client needs into technical specs
- **UI/UX Design** → Even for APIs and CLI tools
- **Database Design** → Complete schema with SQL
- **Cloud** → AWS/Azure architecture and costs
- **Full-Stack** → React + Spring Boot production code
- **DevOps** → Kubernetes, Helm, ArgoCD, CI/CD
- **Networking** → DNS, TCP/IP, Load Balancing, TLS
- **Monitoring** → Prometheus, Grafana, ELK, Jaeger
- **Real Projects** → Finance, E-commerce, Chat, Distributed Systems
- **🔬 DEEP INTERNALS** → How EVERYTHING actually works under the hood!

**This guide is your roadmap from coder to Techno-Functional Expert!**

---

_"The goal is not to become a better coder. It's to become a better problem solver who happens to use code."_
