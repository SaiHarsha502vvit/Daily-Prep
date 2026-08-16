# Android — Networking with Retrofit and OkHttp

**Folder**: [03_Android](./) | **Previous**: [05_Room_Database_And_DataStore.md](./05_Room_Database_And_DataStore.md) | **Next**: [07_Unit_Tests_JUnit_Mockito.md](./07_Unit_Tests_JUnit_Mockito.md)

> **Reading contract**: Networking is where the mobile app meets the real world. Retrofit is the standard Android HTTP client library. OkHttp is the underlying engine Retrofit uses. This file teaches: how Retrofit turns interfaces into API calls, how OkHttp interceptors add auth headers and log traffic, how to handle errors correctly (not just happy paths), certificate pinning for security, and how to test all of this without a real server using MockWebServer.

---

## Table of Contents

1. [OkHttp — The HTTP Engine](#1-okhttp--the-http-engine)
2. [Retrofit — The API Interface Builder](#2-retrofit--the-api-interface-builder)
3. [API Interface Design](#3-api-interface-design)
4. [DTOs — Separating API Models from Domain Models](#4-dtos--separating-api-models-from-domain-models)
5. [Error Handling — Beyond Happy Paths](#5-error-handling--beyond-happy-paths)
6. [OkHttp Interceptors — Auth, Logging, Retry](#6-okhttp-interceptors--auth-logging-retry)
7. [Authentication Patterns](#7-authentication-patterns)
8. [Certificate Pinning](#8-certificate-pinning)
9. [Testing with MockWebServer](#9-testing-with-mockwebserver)
10. [Common Networking Bugs and Their Tests](#10-common-networking-bugs-and-their-tests)
11. [Interview Q&A](#11-interview-qa)

---

## 1. OkHttp — The HTTP Engine

OkHttp is an efficient HTTP client from Square. Retrofit uses it under the hood. Understanding OkHttp directly matters because all advanced features — interceptors, caching, certificate pinning, connection pooling — live here.

```kotlin
// build.gradle.kts:
// implementation("com.squareup.okhttp3:okhttp:4.12.0")
// implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
// implementation("com.squareup.retrofit2:retrofit:2.11.0")
// implementation("com.squareup.retrofit2:converter-gson:2.11.0")
// OR: ("com.jakewharton.retrofit:retrofit2-kotlinx-serialization-converter:1.0.0")
```

### How OkHttp Works

```
YOUR CODE                    OKHTTP PIPELINE                    NETWORK
   │                              │
   │ call.enqueue(callback)        │
   ▼                              ▼
Request ──→ [Interceptor 1] ──→ [Interceptor 2] ──→ [Cache] ──→ TCP Connection
                                                                      │
Response ←─ [Interceptor 2] ←─ [Interceptor 1] ←─ [Cache] ←─ HTTP Response

Each interceptor can: read/modify the request before it goes out
                      read/modify the response before it comes back
                      short-circuit (return early without hitting the network)
```

### Building OkHttp Client

```kotlin
val okHttpClient = OkHttpClient.Builder()
    .connectTimeout(30, TimeUnit.SECONDS)   // time to establish TCP connection
    .readTimeout(30, TimeUnit.SECONDS)       // time to wait for response data
    .writeTimeout(30, TimeUnit.SECONDS)      // time to send request body
    .callTimeout(60, TimeUnit.SECONDS)       // total call timeout (all of the above)
    .addInterceptor(AuthInterceptor(tokenProvider))       // add auth header
    .addInterceptor(HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY   // log everything in debug
        } else {
            HttpLoggingInterceptor.Level.NONE   // no logging in release (security)
        }
    })
    .addInterceptor(RetryInterceptor(maxRetries = 3))     // auto-retry on failure
    .connectionPool(ConnectionPool(5, 5, TimeUnit.MINUTES)) // reuse connections
    .build()
```

---

## 2. Retrofit — The API Interface Builder

Retrofit turns an annotated Kotlin interface into actual HTTP calls using OkHttp:

```kotlin
val retrofit = Retrofit.Builder()
    .baseUrl("https://api.myapp.com/")   // note: trailing slash is required
    .client(okHttpClient)
    .addConverterFactory(
        Json { ignoreUnknownKeys = true }   // kotlinx.serialization
            .asConverterFactory("application/json".toMediaType())
    )
    .build()

val citationApi: CitationApiService = retrofit.create(CitationApiService::class.java)
```

---

## 3. API Interface Design

```kotlin
interface CitationApiService {

    // ─── GET REQUESTS ──────────────────────────────────────────────────────

    // Simple GET — returns list
    @GET("citations")
    suspend fun getCitations(
        @Header("Authorization") token: String,  // per-call header (prefer interceptor)
        @Query("status") status: String? = null, // ?status=PENDING (null = omitted)
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): List<CitationDto>

    // GET with path parameter
    @GET("citations/{id}")
    suspend fun getCitationById(
        @Path("id") citationId: String
    ): CitationDto

    // GET with multiple query parameters from a map
    @GET("citations")
    suspend fun searchCitations(
        @QueryMap filters: Map<String, String>  // ?key1=val1&key2=val2
    ): CitationSearchResultDto

    // ─── POST / PUT / PATCH / DELETE ──────────────────────────────────────

    // POST with JSON body
    @POST("citations/{id}/pay")
    suspend fun payCitation(
        @Path("id") citationId: String,
        @Body request: PaymentRequestDto
    ): PaymentResponseDto

    // PUT — full replace
    @PUT("citations/{id}")
    suspend fun updateCitation(
        @Path("id") id: String,
        @Body citation: UpdateCitationDto
    ): CitationDto

    // PATCH — partial update
    @PATCH("citations/{id}/status")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body statusUpdate: StatusUpdateDto
    ): CitationDto

    // DELETE
    @DELETE("citations/{id}")
    suspend fun deleteCitation(
        @Path("id") citationId: String
    ): Response<Unit>   // Response<Unit> for 204 No Content responses

    // ─── MULTIPART — file upload ──────────────────────────────────────────

    @Multipart
    @POST("citations/{id}/attachments")
    suspend fun uploadAttachment(
        @Path("id") citationId: String,
        @Part("description") description: RequestBody,
        @Part file: MultipartBody.Part
    ): AttachmentDto

    // ─── RESPONSE WRAPPER — when you need HTTP status code ───────────────

    @GET("citations/{id}")
    suspend fun getCitationRaw(
        @Path("id") id: String
    ): Response<CitationDto>
    // Response<T> wraps the Retrofit response:
    // response.isSuccessful   → true if status 200-299
    // response.code()         → HTTP status code
    // response.body()         → CitationDto (null if not successful)
    // response.errorBody()    → error response body (for 4xx/5xx)
}
```

---

## 4. DTOs — Separating API Models from Domain Models

**Never expose Retrofit/JSON classes directly to your domain layer.** The server can change its response format at any time — if your business logic uses the DTO directly, every API change cascades throughout the app.

```kotlin
// DTO — mirrors exactly what the API returns
// Uses kotlinx.serialization for JSON parsing:
@Serializable
data class CitationDto(
    @SerialName("citation_id") val citationId: String,   // API uses snake_case
    @SerialName("citation_no") val citationNumber: String,
    @SerialName("fine_amount") val amount: Double,
    @SerialName("status_code") val statusCode: String,   // API uses codes: "P", "PD", "OD"
    @SerialName("issued_ts") val issuedTimestamp: Long,  // API uses epoch seconds
    @SerialName("due_ts") val dueTimestamp: Long,
    @SerialName("desc") val description: String,
    @SerialName("attachments") val attachmentCount: Int = 0  // optional field
)

@Serializable
data class PaymentRequestDto(
    @SerialName("citation_id") val citationId: String,
    @SerialName("amount") val amount: Double,
    @SerialName("payment_method") val paymentMethod: String
)

// Domain Model — what the rest of the app uses
data class Citation(
    val id: String,
    val citationNumber: String,
    val amount: Double,
    val status: CitationStatus,     // enum — domain concept, not string
    val issuedDate: LocalDateTime,  // proper date type, not epoch
    val dueDate: LocalDateTime,
    val description: String,
    val attachmentCount: Int
)

enum class CitationStatus { PENDING, PAID, OVERDUE, CANCELLED }

// Mapping function — DTO → Domain:
fun CitationDto.toDomain(): Citation {
    return Citation(
        id = citationId,
        citationNumber = citationNumber,
        amount = amount,
        // Map status code to domain enum:
        status = when (statusCode) {
            "P"  -> CitationStatus.PENDING
            "PD" -> CitationStatus.PAID
            "OD" -> CitationStatus.OVERDUE
            "C"  -> CitationStatus.CANCELLED
            else -> throw IllegalArgumentException("Unknown status code: $statusCode")
        },
        // Convert epoch seconds to LocalDateTime:
        issuedDate = Instant.ofEpochSecond(issuedTimestamp)
            .atZone(ZoneId.systemDefault()).toLocalDateTime(),
        dueDate = Instant.ofEpochSecond(dueTimestamp)
            .atZone(ZoneId.systemDefault()).toLocalDateTime(),
        description = description,
        attachmentCount = attachmentCount
    )
}
```

---

## 5. Error Handling — Beyond Happy Paths

The biggest mistake in mobile networking: only handling the happy path.

### The Complete Error Taxonomy

```
ERRORS YOUR APP MUST HANDLE:

1. NO NETWORK CONNECTIVITY
   Exception: java.net.UnknownHostException or java.net.ConnectException
   User sees: "No internet connection" with retry option

2. CONNECTION TIMEOUT
   Exception: java.net.SocketTimeoutException
   User sees: "Request timed out" with retry option

3. SERVER ERRORS (5xx)
   HTTP 500 Internal Server Error → server bug
   HTTP 503 Service Unavailable   → server down or overloaded
   User sees: "Service unavailable" with retry option

4. CLIENT ERRORS (4xx)
   HTTP 400 Bad Request  → we sent invalid data (app bug or data validation)
   HTTP 401 Unauthorized → session expired → navigate to login
   HTTP 403 Forbidden    → user doesn't have permission → show permission error
   HTTP 404 Not Found    → resource deleted or wrong ID → handle gracefully
   HTTP 422 Unprocessable → server validation failed → show field errors

5. SSL/TLS ERRORS
   javax.net.ssl.SSLHandshakeException → certificate pinning failure or
                                          man-in-the-middle attack
   User sees: "Secure connection failed" (do NOT say "certificate pinning")

6. PARSING ERRORS
   kotlinx.serialization.SerializationException → API response format changed
   → This is a bug: server changed its format without updating the app
   User sees: generic error (don't expose parsing details to user)
```

### The Result<T> Pattern — Clean Error Handling

```kotlin
// Repository wraps everything in Result<T> — never throws:
class CitationRepository(private val api: CitationApiService) {

    suspend fun fetchCitations(): Result<List<Citation>> {
        return try {
            val dtos = api.getCitations()
            val citations = dtos.map { it.toDomain() }
            Result.success(citations)
        } catch (e: HttpException) {
            // Handle HTTP error status codes (4xx, 5xx)
            Result.failure(mapHttpError(e))
        } catch (e: UnknownHostException) {
            Result.failure(NetworkException.NoConnectivity())
        } catch (e: SocketTimeoutException) {
            Result.failure(NetworkException.Timeout())
        } catch (e: SerializationException) {
            Result.failure(NetworkException.ParseError(e.message ?: "Parse error"))
        } catch (e: Exception) {
            Result.failure(NetworkException.Unknown(e.message ?: "Unknown error"))
        }
    }

    private fun mapHttpError(e: HttpException): AppException {
        return when (e.code()) {
            400 -> AppException.BadRequest(parseErrorMessage(e))
            401 -> AppException.Unauthorized()          // session expired → logout
            403 -> AppException.Forbidden()             // no permission
            404 -> AppException.NotFound()              // resource deleted
            422 -> AppException.ValidationError(parseValidationErrors(e))
            in 500..599 -> AppException.ServerError(e.code())
            else -> AppException.Unknown(e.code(), e.message())
        }
    }

    private fun parseErrorMessage(e: HttpException): String {
        return try {
            // Most APIs return JSON error body: {"error": "Invalid citation ID"}
            val errorBody = e.response()?.errorBody()?.string() ?: return "Bad request"
            val errorDto = Json.decodeFromString<ApiErrorDto>(errorBody)
            errorDto.error
        } catch (parseEx: Exception) {
            "Bad request"
        }
    }
}

// Typed exception hierarchy:
sealed class AppException(message: String) : Exception(message) {
    class Unauthorized : AppException("Session expired")
    class Forbidden : AppException("Access denied")
    class NotFound : AppException("Resource not found")
    data class BadRequest(val detail: String) : AppException(detail)
    data class ValidationError(val fields: Map<String, String>) : AppException("Validation failed")
    data class ServerError(val code: Int) : AppException("Server error: $code")
    class Unknown(val code: Int? = null, detail: String) : AppException(detail)
}

sealed class NetworkException(message: String) : Exception(message) {
    class NoConnectivity : NetworkException("No internet connection")
    class Timeout : NetworkException("Request timed out")
    data class ParseError(val detail: String) : NetworkException(detail)
    data class Unknown(val detail: String) : NetworkException(detail)
}
```

---

## 6. OkHttp Interceptors — Auth, Logging, Retry

### Auth Interceptor — Automatic JWT Header

```kotlin
class AuthInterceptor(
    private val tokenProvider: TokenProvider  // reads token from DataStore/Keystore
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip auth for endpoints that don't need it:
        if (originalRequest.url.encodedPath.contains("/auth/login") ||
            originalRequest.url.encodedPath.contains("/auth/register")) {
            return chain.proceed(originalRequest)
        }

        val token = tokenProvider.getAccessToken()  // blocking call — OK in interceptor
                    ?: return chain.proceed(originalRequest)  // no token → proceed without

        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .header("X-App-Version", BuildConfig.VERSION_NAME)
            .header("X-Platform", "android")
            .build()

        return chain.proceed(authenticatedRequest)
    }
}
```

### Authenticator — Handle 401 by Refreshing Token

```kotlin
// Authenticator is called automatically when a 401 is received:
class TokenRefreshAuthenticator(
    private val tokenRepository: TokenRepository
) : Authenticator {

    private val isRefreshing = AtomicBoolean(false)
    private val lock = ReentrantLock()

    override fun authenticate(route: Route?, response: Response): Request? {
        // If this is ALREADY a retry from a refresh → don't retry again (infinite loop)
        if (response.request.header("X-Retry-After-Refresh") != null) {
            return null  // give up — token refresh failed or new token also rejected
        }

        lock.lock()
        try {
            // Multiple concurrent requests might all get 401 — only refresh once
            if (isRefreshing.compareAndSet(false, true)) {
                val newToken = runBlocking {
                    tokenRepository.refreshToken()  // call /auth/refresh endpoint
                }
                isRefreshing.set(false)

                if (newToken == null) {
                    // Refresh failed → user must log in again
                    runBlocking { tokenRepository.clearTokens() }
                    return null
                }

                // Retry the original request with the new token:
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $newToken")
                    .header("X-Retry-After-Refresh", "true")  // prevent infinite retry
                    .build()
            }
        } finally {
            lock.unlock()
        }
        return null
    }
}
```

### Retry Interceptor — Automatic Retry on Transient Failures

```kotlin
class RetryInterceptor(private val maxRetries: Int = 3) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        var attempt = 0
        var lastException: IOException? = null

        while (attempt < maxRetries) {
            try {
                val response = chain.proceed(chain.request())

                // Only retry on specific server errors (503 = temporary unavailability):
                if (response.code == 503 && attempt < maxRetries - 1) {
                    response.close()
                    Thread.sleep(exponentialBackoff(attempt))
                    attempt++
                    continue
                }

                return response
            } catch (e: IOException) {
                // Network errors are transient — retry
                lastException = e
                if (attempt < maxRetries - 1) {
                    Thread.sleep(exponentialBackoff(attempt))
                }
                attempt++
            }
        }

        throw lastException ?: IOException("Max retries exceeded")
    }

    private fun exponentialBackoff(attempt: Int): Long {
        // 500ms, 1000ms, 2000ms — exponential with jitter:
        val base = 500L * (2.0.pow(attempt)).toLong()
        val jitter = (Math.random() * 200).toLong()
        return base + jitter
    }
}
```

---

## 7. Authentication Patterns

### JWT (JSON Web Token) Flow

```
LOGIN:
  POST /auth/login { email, password }
  ← 200 { access_token: "eyJ...", refresh_token: "abc...",
           expires_in: 3600 }  // access token expires in 1 hour

SUBSEQUENT REQUESTS:
  GET /citations
  Authorization: Bearer eyJ...   (access token in header)

TOKEN EXPIRED (after 1 hour):
  GET /citations
  ← 401 Unauthorized

TOKEN REFRESH:
  POST /auth/refresh { refresh_token: "abc..." }
  ← 200 { access_token: "eyJ_new...", refresh_token: "abc_new..." }
  → Store new tokens, retry original request

REFRESH FAILED (refresh token also expired):
  POST /auth/refresh { refresh_token: "abc..." }
  ← 401 Unauthorized
  → Clear tokens from storage → navigate to login screen
```

### Secure Token Storage on Android

```kotlin
// WRONG — tokens in SharedPreferences (readable by backup, other apps with root):
sharedPrefs.edit().putString("access_token", token).apply()

// WRONG — tokens in BuildConfig (visible in APK, decompilable):
val token = BuildConfig.API_SECRET  // never for user tokens

// CORRECT — Android Keystore (hardware-backed encryption):
class SecureTokenStorage(context: Context) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val encryptedPrefs = EncryptedSharedPreferences.create(
        context,
        "secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    // The encryption key is stored in Android Keystore — not in the file system
    // Even with root access, the encrypted data cannot be read without the device key

    fun saveAccessToken(token: String) {
        encryptedPrefs.edit().putString("access_token", token).apply()
    }

    fun getAccessToken(): String? = encryptedPrefs.getString("access_token", null)

    fun clearAllTokens() {
        encryptedPrefs.edit().clear().apply()
    }
}
```

---

## 8. Certificate Pinning

Certificate pinning ensures the app ONLY trusts a specific server certificate — if an attacker intercepts traffic with a different certificate (even a valid CA-signed one), the connection is rejected.

```kotlin
val certPinner = CertificatePinner.Builder()
    // Get pin values: $ echo | openssl s_client -connect api.myapp.com:443 |
    //                  openssl x509 -pubkey -noout |
    //                  openssl pkey -pubin -outform der |
    //                  openssl dgst -sha256 -binary | base64
    .add(
        "api.myapp.com",
        "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",  // current cert
        "sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB="   // backup cert
    )
    // Always include at least 2 pins: current cert + backup
    // If you pin only the current cert and it rotates → ALL USERS LOCKED OUT
    .build()

val client = OkHttpClient.Builder()
    .certificatePinner(certPinner)
    .build()
```

### Certificate Pinning and Testing

```
QA IMPLICATION:
Certificate pinning BREAKS Burp Suite / Charles Proxy / HTTP Toolkit
(which use their own certificate to intercept HTTPS traffic).

For security testing and debugging:
  Option 1: Disable pinning in DEBUG builds (BuildConfig.DEBUG check)
  Option 2: Use a separate test build with pinning disabled
  Option 3: Use Frida/Magisk to bypass pinning on rooted device for pen testing

QA TEST for pinning:
  1. Set up Charles Proxy on Mac, configure proxy on device
  2. Install Charles certificate on device (as trusted CA)
  3. Open the app
  Expected (with pinning): SSL handshake error, all API calls fail
           (without pinning): calls succeed, Charles can intercept them
  This verifies the pinning is active in production builds
```

---

## 9. Testing with MockWebServer

MockWebServer (from Square/OkHttp) creates a real local HTTP server that your app actually connects to during tests:

```kotlin
// build.gradle.kts:
// testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")

class CitationRepositoryTest {

    private val server = MockWebServer()
    private lateinit var api: CitationApiService
    private lateinit var repository: CitationRepository

    @Before
    fun setup() {
        server.start()

        // Point Retrofit at the local mock server:
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))  // http://localhost:PORT/
            .addConverterFactory(
                Json { ignoreUnknownKeys = true }
                    .asConverterFactory("application/json".toMediaType())
            )
            .client(OkHttpClient())  // no interceptors in tests (test auth separately)
            .build()

        api = retrofit.create(CitationApiService::class.java)
        repository = CitationRepository(api)
    }

    @After
    fun teardown() {
        server.shutdown()
    }

    // ── HAPPY PATH TESTS ────────────────────────────────────────────────

    @Test
    fun fetchCitations_successResponse_returnsMappedDomainList() = runTest {
        // Arrange: server returns 200 with valid JSON
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody("""
                [
                    {
                        "citation_id": "CIT-001",
                        "citation_no": "CN-001",
                        "fine_amount": 150.0,
                        "status_code": "P",
                        "issued_ts": 1704067200,
                        "due_ts": 1706745600,
                        "desc": "Parking violation",
                        "attachments": 0
                    }
                ]
            """.trimIndent()))

        // Act:
        val result = repository.fetchCitations()

        // Assert result:
        assertTrue(result.isSuccess)
        val citations = result.getOrNull()!!
        assertEquals(1, citations.size)
        assertEquals("CIT-001", citations[0].id)
        assertEquals(150.0, citations[0].amount, 0.001)
        assertEquals(CitationStatus.PENDING, citations[0].status)  // "P" → PENDING mapping

        // Assert request that was sent:
        val request = server.takeRequest()
        assertEquals("GET", request.method)
        assertEquals("/citations", request.path)
    }

    // ── ERROR PATH TESTS ────────────────────────────────────────────────

    @Test
    fun fetchCitations_401Response_returnsUnauthorizedFailure() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(401)
            .setBody("""{"error": "Token expired"}"""))

        val result = repository.fetchCitations()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull()).isInstanceOf(AppException.Unauthorized::class.java)
    }

    @Test
    fun fetchCitations_500Response_returnsServerErrorFailure() = runTest {
        server.enqueue(MockResponse().setResponseCode(500))

        val result = repository.fetchCitations()

        assertTrue(result.isFailure)
        val exception = result.exceptionOrNull()
        assertThat(exception).isInstanceOf(AppException.ServerError::class.java)
        assertEquals(500, (exception as AppException.ServerError).code)
    }

    @Test
    fun fetchCitations_noNetwork_returnsConnectivityFailure() = runTest {
        // Simulate no network — shut down server before making request:
        server.shutdown()

        val result = repository.fetchCitations()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull())
            .isInstanceOf(NetworkException.NoConnectivity::class.java)
    }

    @Test
    fun fetchCitations_slowNetwork_returnsTimeoutFailure() = runTest {
        // Simulate timeout:
        server.enqueue(MockResponse()
            .setBodyDelay(35, TimeUnit.SECONDS)  // longer than 30s read timeout
            .setResponseCode(200)
            .setBody("[]"))

        val shortTimeoutClient = OkHttpClient.Builder()
            .readTimeout(1, TimeUnit.SECONDS)  // 1 second timeout for this test
            .build()

        val fastTimeoutApi = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .client(shortTimeoutClient)
            .build()
            .create(CitationApiService::class.java)

        val timeoutRepo = CitationRepository(fastTimeoutApi)
        val result = timeoutRepo.fetchCitations()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull())
            .isInstanceOf(NetworkException.Timeout::class.java)
    }

    @Test
    fun fetchCitations_malformedJson_returnsParseErrorFailure() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setHeader("Content-Type", "application/json")
            .setBody("{ this is not valid JSON "))

        val result = repository.fetchCitations()

        assertTrue(result.isFailure)
        assertThat(result.exceptionOrNull())
            .isInstanceOf(NetworkException.ParseError::class.java)
    }

    @Test
    fun payCitation_verifyRequestBody() = runTest {
        server.enqueue(MockResponse()
            .setResponseCode(200)
            .setBody("""{"receipt_id": "RCP-001", "timestamp": 1704067200}"""))

        repository.payCitation("CIT-001", 150.0, "CREDIT_CARD")

        // Verify the request body that was sent:
        val request = server.takeRequest()
        assertEquals("POST", request.method)
        assertEquals("/citations/CIT-001/pay", request.path)

        val requestBody = request.body.readUtf8()
        val bodyJson = Json.decodeFromString<JsonObject>(requestBody)
        assertEquals("CIT-001", bodyJson["citation_id"]?.jsonPrimitive?.content)
        assertEquals(150.0, bodyJson["amount"]?.jsonPrimitive?.double)
        assertEquals("CREDIT_CARD", bodyJson["payment_method"]?.jsonPrimitive?.content)
    }

    @Test
    fun authInterceptor_addsAuthorizationHeader() = runTest {
        // Test that the auth interceptor correctly adds headers:
        val fakeToken = "test-jwt-token-123"
        val tokenProvider = FakeTokenProvider(fakeToken)

        val clientWithAuth = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenProvider))
            .build()

        val apiWithAuth = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .client(clientWithAuth)
            .build()
            .create(CitationApiService::class.java)

        server.enqueue(MockResponse().setResponseCode(200).setBody("[]"))

        CitationRepository(apiWithAuth).fetchCitations()

        val request = server.takeRequest()
        assertEquals("Bearer $fakeToken", request.getHeader("Authorization"))
    }
}
```

---

## 10. Common Networking Bugs and Their Tests

### Bug 1: No Timeout → App Hangs Forever

```
SYMPTOM: User taps an action, app shows loading spinner indefinitely.
         No timeout is set on OkHttp client.
CAUSE:   Default OkHttp timeout is 10 seconds for connect, unlimited for read.
         If server hangs (accepts connection but never responds), call never completes.
FIX:     Always set callTimeout, readTimeout, connectTimeout.
QA TEST: Set up MockWebServer with setBodyDelay(∞). Verify app shows timeout error after ~30s.
```

### Bug 2: Auth Token Renewal Not Thread-Safe

```
SYMPTOM: Multiple simultaneous 401 responses cause multiple refresh calls.
         Occasionally the refresh fails, user is logged out unexpectedly.
CAUSE:   TokenRefreshAuthenticator not synchronized — two threads refresh simultaneously.
FIX:     Use AtomicBoolean + ReentrantLock (as shown in Section 6).
QA TEST:
  1. Expire the access token (set a very short expiry on test environment)
  2. Trigger 5 simultaneous API calls
  3. Expected: exactly ONE refresh request to /auth/refresh
  4. All 5 calls succeed with the new token
  Bug: /auth/refresh is called 5 times, race condition, some calls fail
```

### Bug 3: Error Body Not Parsed → User Sees Generic Message

```
SYMPTOM: Server returns validation error with field-level detail:
         {"errors": {"email": "Already taken", "phone": "Invalid format"}}
         But user sees generic "Something went wrong" message.
CAUSE:   Repository catches HttpException but only logs the status code,
         doesn't parse errorBody().
FIX:     Parse errorBody() for 4xx responses and map to structured errors.
QA TEST:
  1. Submit registration with an already-taken email
  2. Expected: "Email already taken" shown next to email field
  Bug: Generic error message shown
```

### Bug 4: Cleartext Traffic in Production

```
SYMPTOM: HTTP (not HTTPS) calls succeed in production app.
CAUSE:   android:usesCleartextTraffic="true" in production manifest.
         OR: the API URL in production flavor uses http:// instead of https://.
SECURITY RISK: Data sent in plaintext — man-in-the-middle readable.
QA TEST:
  1. Use proxy tool (Charles/mitmproxy) with HTTP (not HTTPS) interception
  2. Make any API call in production build
  Expected: Connection refused or SSL error (cleartext blocked)
  Bug: Request visible in proxy in plaintext
```

---

## 11. Interview Q&A

**Q: "What is Retrofit and how does it work?"**

> "Retrofit is an HTTP client for Android that turns annotated Kotlin interfaces into actual HTTP calls. You define an interface with annotations describing the HTTP method, URL, parameters, and return type — Retrofit uses reflection and code generation at runtime to create an implementation that delegates to OkHttp for actual networking. The key advantage: you describe WHAT you want (`@GET("citations")`) and Retrofit handles HOW (building the request, executing it on a background thread, parsing the response via a converter). The suspend function support means the call integrates naturally with coroutines — no callbacks needed."

**Q: "What is an OkHttp interceptor and what can you use them for?"**

> "An interceptor is a function that sits in the request/response chain and can observe, modify, or short-circuit both requests and responses. Common uses: an authentication interceptor adds the Bearer token to every request header without duplicating that logic everywhere; a logging interceptor logs all HTTP traffic in debug builds; a retry interceptor automatically retries on transient network errors; a caching interceptor adds Cache-Control headers. Interceptors are added to OkHttpClient and apply to every call made through that client — they are the correct abstraction for cross-cutting concerns like auth, rather than adding it to each API interface method."

**Q: "How would you test an API repository without hitting the real server?"**

> "I use OkHttp's MockWebServer — a real local HTTP server that runs in the test JVM. MockWebServer accepts `MockResponse` objects that define what status code and body to return for each request. I point Retrofit's baseUrl at `server.url('/')` — the real OkHttp makes actual TCP connections to the local mock server. This means I'm testing real HTTP request serialization, real response deserialization, real error handling for HTTP status codes, real timeout behavior, and even the request body content via `server.takeRequest()`. It's the gold standard for networking integration tests because it tests the real code path without external dependencies."

---

**Next in this folder**: [07_Unit_Tests_JUnit_Mockito.md](./07_Unit_Tests_JUnit_Mockito.md) — JUnit 5, MockK, coroutine testing, and test structure for every Android layer.

**Back to**: [Android folder index](./) | [Series index](../)


---

## Reality Check

**"Retrofit just makes API calls"** — Retrofit and OkHttp are a layered HTTP stack whose configuration is where mobile-networking correctness lives ([13_DE networking, 22 HTTP]'s app-side lessons, Android flavor): the TIMEOUTS (the mobile network that is slow and flaky — the [Ch61] network conditions, the default timeouts that must be tuned, the [13_DE] timeout budget), the RETRIES and error handling (the request that fails on the subway — the [distributed-systems] retry with idempotency), the interceptors (the auth-token injection, the logging, the [22 HTTP] header handling — OkHttp's interceptor chain that is the [21_SDET Ch55]-like pipeline), the connection pooling and caching (OkHttp's HTTP cache, the [22 HTTP] cache-control). "Just makes API calls" misses that the mobile networking layer must handle the flaky, slow, intermittent mobile network — and the timeout, retry, error, and caching configuration is what separates the app that works on hotel wifi from the one that hangs.

**"The app has a network connection or it doesn't"** — Mobile connectivity is a SPECTRUM and a moving target ([22 WiFi, Ch61] network reality): the connection that is present but unusable (the captive portal, the connected-but-no-internet — the [22 servers/ports] connected-is-not-working), the transitions (wifi to cellular mid-request, the [22 WiFi] roaming — the request that must survive or retry), the metered connection (the user on limited data who does not want your app downloading megabytes — the data-usage consideration), and the intermittent drops (the tunnel, the elevator). "Connected or not" is the binary that mobile violates constantly — the app must handle the spectrum (usable-but-slow, connected-but-no-internet, transitioning, metered, intermittent), and the naive is-connected check plus assume-it-works produces the app that hangs on captive portals, fails on network transitions, and burns metered data.

**"Parsing JSON is straightforward with the library"** — JSON handling on mobile has real correctness and robustness concerns: the null and missing fields (the server that omits a field or sends null — the [16_JS] null handling, the [17_TS] boundary validation — the app that crashes on the unexpected-null response, the reason for careful nullability in the data models), the schema evolution (the server that adds/changes fields — the tolerant-reader [13_DE REST], the app on an old version hitting a new API), the type mismatches (the number-as-string, the [16_JS] coercion surprises), and the error responses (the [13_DE REST] status codes, the error-body-with-200 that the naive parser treats as success). "Straightforward with the library" misses that the boundary between the untrusted server response and your typed models is exactly where [17_TS, 13_DE]'s validate-at-the-boundary applies — the app that trusts the response shape crashes on the null, the missing field, the type mismatch, or the error-as-200 that real servers produce.

**"HTTPS handles mobile security"** — HTTPS is necessary and insufficient for mobile app security ([22 TLS, security]): the certificate PINNING consideration (the mobile app that pins certs to resist man-in-the-middle on hostile networks — the [22 TLS] MITM, the trade-off of pinning breaking on cert rotation), the secrets in the app (the API key hardcoded in the app that is EXTRACTABLE — the app binary is on the user's device, decompilable, so client-side secrets are not secret, the [security] lesson that mobile makes acute), the local data security ([05] encryption at rest, the lost-device threat), and the network security on hostile wifi ([22 WiFi, networking-security]). "HTTPS handles it" is the [22 TLS] encryption-is-not-all-of-security, sharpened on mobile — the app binary is in the attacker's hands (extractable secrets), the device can be lost (local data), and the networks are hostile (pinning, MITM) — so mobile security is HTTPS plus cert pinning plus no-client-secrets plus local encryption plus hostile-network assumptions.

**"Testing networking means mocking the API"** — Mocking is necessary and the mobile-networking test matrix is broader ([21_SDET Ch31, Ch61]): the ERROR responses (the 500, the timeout, the malformed body — the [21_SDET Ch31] error simulation, the app's error-handling paths that the happy-path mock never exercises), the NETWORK CONDITIONS (the slow/offline/flaky — the [Ch61] network emulation, the app under real mobile conditions), the CONNECTIVITY transitions (the wifi-to-cellular, the offline-then-online — the [05] sync-on-reconnect), and the boundary robustness (the null fields, the schema changes — the [above] parsing robustness). "Mocking the API" with happy-path responses tests the happy path — the valuable mobile-networking tests inject the errors, the slow/offline conditions, the transitions, and the malformed responses, because those are exactly the mobile-network realities (flaky, slow, intermittent, hostile) that the app must survive and that the clean mock hides.
