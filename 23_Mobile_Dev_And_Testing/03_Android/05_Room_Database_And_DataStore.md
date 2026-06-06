# Android — Room Database and DataStore

**Folder**: [03_Android](./) | **Previous**: [04_Jetpack_Compose_Deep_Dive.md](./04_Jetpack_Compose_Deep_Dive.md) | **Next**: [06_Networking_Retrofit_OkHttp.md](./06_Networking_Retrofit_OkHttp.md)

> **Reading contract**: Persistence is where most mobile bugs live. Room is Android's database library (SQLite abstraction). DataStore is the modern replacement for SharedPreferences. This file teaches both in full depth: Room entities, DAOs, database versioning and migrations, testing strategies, and DataStore for key-value preferences. You will also understand exactly what SURVIVES across process death, rotation, and app restart — which is critical for both development and QA.

---

## Table of Contents

1. [SQLite vs Room vs SharedPreferences vs DataStore](#1-sqlite-vs-room-vs-sharedpreferences-vs-datastore)
2. [Room — Core Architecture](#2-room--core-architecture)
3. [Entity — Mapping Kotlin Classes to Tables](#3-entity--mapping-kotlin-classes-to-tables)
4. [DAO — Data Access Object Pattern](#4-dao--data-access-object-pattern)
5. [The Database Class](#5-the-database-class)
6. [Type Converters — Storing Complex Types](#6-type-converters--storing-complex-types)
7. [Relations — One-to-Many, Many-to-Many](#7-relations--one-to-many-many-to-many)
8. [Database Migrations — The Critical QA Scenario](#8-database-migrations--the-critical-qa-scenario)
9. [Room + Flow — Reactive Database](#9-room--flow--reactive-database)
10. [Testing Room (Integration Tests)](#10-testing-room-integration-tests)
11. [DataStore — Modern SharedPreferences](#11-datastore--modern-sharedpreferences)
12. [What Persists — The Definitive Table](#12-what-persists--the-definitive-table)
13. [Common Room Bugs and Their Tests](#13-common-room-bugs-and-their-tests)
14. [Interview Q&A](#14-interview-qa)

---

## 1. SQLite vs Room vs SharedPreferences vs DataStore

```
STORAGE TYPE       USE CASE                         Size      Structured?  Async?
─────────────────  ───────────────────────────────  ────────  ───────────  ──────
SQLite (raw)       Relational data, custom SQL       Any       YES          NO (you manage)
Room               SQLite with compile-time checks  Any       YES          YES (suspend/Flow)
SharedPreferences  Simple key-value pairs (old API)  Small     NO           NO (IO on main)
DataStore Prefs    Simple key-value pairs (modern)   Small     NO           YES (Flow/async)
DataStore Proto    Structured prefs (Protobuf)        Small     YES          YES (Flow/async)
File/Assets        Binary/text files, JSON           Any       NO           NO (you manage)
```

**When to use Room**:
- User's data (citations, payments, profile)
- Cached API responses
- Offline-capable features
- Any data with relationships (user has many citations)
- Any data you want to query with SQL

**When to use DataStore (Preferences)**:
- User settings (dark mode, notification preferences)
- Small configuration values
- Simple flags (onboarding complete, app version seen)

**Never use SharedPreferences** in new code — it has no coroutine support, reads on the main thread can cause ANR, and it has corruption bugs. DataStore is the replacement.

---

## 2. Room — Core Architecture

```
YOUR CODE
    │
    │  uses
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  ROOM                                                            │
│                                                                  │
│  @Entity              → maps a Kotlin class to a SQLite table    │
│  @Dao (interface)     → SQL queries, type-safe at compile time   │
│  @Database (abstract) → the database itself, provides DAOs       │
│  @TypeConverter       → converts non-primitive types for storage │
└──────────────────────────────────────────────────────────────────┘
    │
    │  wraps
    ▼
SQLITE FILE on disk (e.g., /data/data/com.myapp/databases/app.db)
```

**The annotation processor** (KSP) reads your `@Entity`, `@Dao`, and `@Database` annotations at compile time and generates the actual SQLite code. Room's biggest advantage over raw SQLite: **SQL is verified at compile time** — if your query has a typo or references a non-existent column, the build fails.

---

## 3. Entity — Mapping Kotlin Classes to Tables

```kotlin
// Every @Entity becomes a SQLite table
// Every property becomes a column

@Entity(
    tableName = "citations",
    // Composite unique constraint:
    indices = [Index(value = ["citation_number", "year"], unique = true)]
)
data class CitationEntity(

    @PrimaryKey(autoGenerate = false)  // We use our own ID, not auto-increment
    @ColumnInfo(name = "id")
    val id: String,                    // TEXT PRIMARY KEY

    @ColumnInfo(name = "citation_number")
    val citationNumber: String,        // TEXT NOT NULL

    @ColumnInfo(name = "amount")
    val amount: Double,                // REAL NOT NULL

    @ColumnInfo(name = "status")
    val status: String,                // TEXT NOT NULL ("PENDING", "PAID", "OVERDUE")

    @ColumnInfo(name = "issued_date")
    val issuedDate: Long,              // INTEGER (stored as Unix timestamp ms)
    // ↑ Date stored as Long — requires TypeConverter for LocalDateTime (see section 6)

    @ColumnInfo(name = "due_date")
    val dueDate: Long,

    @ColumnInfo(name = "description")
    val description: String,

    @ColumnInfo(name = "owner_id")
    val ownerId: String,               // foreign key to users table

    // Column with default value:
    @ColumnInfo(name = "sync_status", defaultValue = "PENDING_SYNC")
    val syncStatus: String = "PENDING_SYNC"
)

// Separate entity for the PAYMENTS table (one citation, many payments)
@Entity(
    tableName = "payments",
    foreignKeys = [ForeignKey(
        entity = CitationEntity::class,
        parentColumns = ["id"],
        childColumns = ["citation_id"],
        onDelete = ForeignKey.CASCADE   // if citation deleted → payments deleted too
    )],
    indices = [Index("citation_id")]    // index the foreign key for fast joins
)
data class PaymentEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "citation_id") val citationId: String,
    @ColumnInfo(name = "amount") val amount: Double,
    @ColumnInfo(name = "timestamp") val timestamp: Long,
    @ColumnInfo(name = "receipt_id") val receiptId: String
)
```

### Naming Convention: Entity vs Domain Model

```
CitationEntity  → stored in Room database (has id, syncStatus, db-specific fields)
Citation        → domain model used in business logic (clean, no db-specific fields)

WHY TWO CLASSES?
  The database schema can change independently of business logic.
  Domain models are stable; Entity schemas evolve with migrations.

MAPPING (in Repository):
  CitationEntity.toDomain() = Citation(id = id, amount = amount, ...)
  Citation.toEntity() = CitationEntity(id = id, amount = amount, ...)
```

---

## 4. DAO — Data Access Object Pattern

```kotlin
@Dao
interface CitationDao {

    // ─── QUERIES ─────────────────────────────────────────────────────

    // suspend = runs asynchronously (on a background thread via Room)
    @Query("SELECT * FROM citations WHERE id = :citationId")
    suspend fun getCitationById(citationId: String): CitationEntity?
    // Returns null if not found — test this edge case

    // Flow<> = reactive — emits whenever the data in this table changes
    @Query("SELECT * FROM citations WHERE owner_id = :userId ORDER BY issued_date DESC")
    fun observeAllCitations(userId: String): Flow<List<CitationEntity>>
    // NOT suspend — Flow handles async naturally

    // Filtered query with multiple conditions:
    @Query("""
        SELECT * FROM citations
        WHERE owner_id = :userId
        AND status = :status
        AND amount BETWEEN :minAmount AND :maxAmount
        ORDER BY issued_date DESC
        LIMIT :limit OFFSET :offset
    """)
    suspend fun getCitationsByStatusAndAmount(
        userId: String,
        status: String,
        minAmount: Double,
        maxAmount: Double,
        limit: Int,
        offset: Int
    ): List<CitationEntity>

    // Aggregate query:
    @Query("SELECT SUM(amount) FROM citations WHERE owner_id = :userId AND status = 'PENDING'")
    suspend fun getTotalPendingAmount(userId: String): Double?
    // Returns null if no rows match — test this

    // ─── INSERTS ─────────────────────────────────────────────────────

    // OnConflictStrategy.REPLACE: if ID exists, replace entirely
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCitation(citation: CitationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCitations(citations: List<CitationEntity>)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertIfNotExists(citation: CitationEntity): Long
    // Returns rowId of inserted row, or -1 if ignored (already exists)

    // ─── UPDATES ─────────────────────────────────────────────────────

    // @Update matches by primary key
    @Update
    suspend fun updateCitation(citation: CitationEntity)

    // Partial update with custom query (better than fetching and updating entire entity):
    @Query("UPDATE citations SET status = :newStatus WHERE id = :citationId")
    suspend fun updateCitationStatus(citationId: String, newStatus: String)

    @Query("UPDATE citations SET sync_status = :syncStatus WHERE id IN (:ids)")
    suspend fun markAsSynced(ids: List<String>, syncStatus: String = "SYNCED")

    // ─── DELETES ─────────────────────────────────────────────────────

    @Delete
    suspend fun deleteCitation(citation: CitationEntity)

    @Query("DELETE FROM citations WHERE id = :citationId")
    suspend fun deleteCitationById(citationId: String)

    @Query("DELETE FROM citations WHERE owner_id = :userId")
    suspend fun deleteAllForUser(userId: String)

    @Query("DELETE FROM citations")
    suspend fun deleteAll()

    // ─── TRANSACTIONS ─────────────────────────────────────────────────

    // @Transaction: the entire function runs in one SQLite transaction
    // If any part fails, ALL changes roll back
    @Transaction
    suspend fun replaceCitationsForUser(userId: String, newCitations: List<CitationEntity>) {
        deleteAllForUser(userId)
        insertCitations(newCitations)
        // If insertCitations throws, deleteAllForUser also rolls back
    }
}
```

### The Conflict Strategy Decision

```
OnConflictStrategy.REPLACE:
  If row with same primary key exists → DELETE it → INSERT new row
  Use when: syncing from server (server data is truth)
  Danger: Triggers delete CASCADE on foreign keys, which may delete child rows

OnConflictStrategy.IGNORE:
  If row with same primary key exists → silently ignore the insert
  Use when: you only want to insert if not already present
  Returns: -1 if ignored, rowId if inserted

OnConflictStrategy.ABORT (default):
  If row with same primary key exists → throw SQLiteConstraintException
  Use when: duplicates are always a programming error

OnConflictStrategy.UPDATE (Room 2.5+):
  If row with same primary key exists → update only changed columns
  Better than REPLACE for preserving child rows (no delete cascade)
```

---

## 5. The Database Class

```kotlin
@Database(
    entities = [CitationEntity::class, PaymentEntity::class, UserEntity::class],
    version = 3,             // increment when schema changes
    exportSchema = true      // exports schema to JSON — track in version control
)
@TypeConverters(DateTimeConverters::class)
abstract class AppDatabase : RoomDatabase() {

    // Room generates implementations of these abstract functions
    abstract fun citationDao(): CitationDao
    abstract fun paymentDao(): PaymentDao
    abstract fun userDao(): UserDao

    companion object {
        // Singleton pattern — only ONE database instance per app process
        @Volatile  // ensures visibility across threads
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                // Double-checked locking:
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "app_database"   // filename: /data/data/.../databases/app_database
                )
                    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
```

### Dependency Injection with Hilt

```kotlin
// In practice, you don't call getDatabase() directly — Hilt provides it:
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
            .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
            .build()
    }

    @Provides
    fun provideCitationDao(database: AppDatabase): CitationDao = database.citationDao()
}
// Now inject CitationDao directly into Repository — no need to call getDatabase()
```

---

## 6. Type Converters — Storing Complex Types

SQLite only supports: TEXT, INTEGER, REAL, BLOB, NULL. For anything else, you need a TypeConverter.

```kotlin
class DateTimeConverters {
    // Long (milliseconds since epoch) ↔ java.time.LocalDateTime

    @TypeConverter
    fun fromTimestamp(value: Long?): LocalDateTime? {
        return value?.let {
            Instant.ofEpochMilli(it)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime()
        }
    }

    @TypeConverter
    fun dateToTimestamp(date: LocalDateTime?): Long? {
        return date?.atZone(ZoneId.systemDefault())
            ?.toInstant()
            ?.toEpochMilli()
    }
}

class StringListConverter {
    // List<String> ↔ JSON string (stored as TEXT)
    // Example: ["tag1", "tag2"] stored as '["tag1","tag2"]'

    @TypeConverter
    fun fromStringList(value: List<String>?): String? {
        return value?.let { Json.encodeToString(it) }
    }

    @TypeConverter
    fun toStringList(value: String?): List<String>? {
        return value?.let { Json.decodeFromString(it) }
    }
}

// Register converters at database level:
@Database(entities = [...], version = 3)
@TypeConverters(DateTimeConverters::class, StringListConverter::class)
abstract class AppDatabase : RoomDatabase()
```

---

## 7. Relations — One-to-Many, Many-to-Many

### One-to-Many: One Citation has Many Payments

```kotlin
// The relation data class (not an @Entity):
data class CitationWithPayments(
    @Embedded val citation: CitationEntity,
    @Relation(
        parentColumn = "id",        // CitationEntity.id
        entityColumn = "citation_id" // PaymentEntity.citation_id
    )
    val payments: List<PaymentEntity>
)

// DAO query — @Transaction required for multi-table fetches:
@Transaction
@Query("SELECT * FROM citations WHERE id = :citationId")
suspend fun getCitationWithPayments(citationId: String): CitationWithPayments?
```

### Many-to-Many: Citation has many Tags, Tag has many Citations

```kotlin
// Junction/cross-reference table:
@Entity(tableName = "citation_tag_cross_ref",
        primaryKeys = ["citation_id", "tag_id"])
data class CitationTagCrossRef(
    val citation_id: String,
    val tag_id: String
)

data class CitationWithTags(
    @Embedded val citation: CitationEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "tag_id",
        associateBy = Junction(CitationTagCrossRef::class,
                               parentColumn = "citation_id",
                               entityColumn = "tag_id")
    )
    val tags: List<TagEntity>
)
```

---

## 8. Database Migrations — The Critical QA Scenario

When you change the database schema (add/remove/rename a column or table), you must provide a **migration** — code that transforms the old schema to the new one. This is one of the most common sources of production crashes.

### What Happens Without Migration

```
App v1.0 installed: database schema version 1
User installs App v2.0: database schema version 2 (new column added)

WITHOUT MIGRATION:
  Room sees version mismatch (1 → 2)
  No migration found for this path
  → Room throws: "A migration from 1 to 2 was required but not found"
  → App CRASHES on launch for all existing users
  → New installs work fine (fresh database, version 2)
  → Only users UPDATING from v1 crash

WITH FALLBACK (wrong solution):
  .fallbackToDestructiveMigration()  // drops and recreates the database
  → All user data is LOST on update
  → User opens app, their citations are gone
  → Serious production bug, possible legal issue (financial data lost)
```

### Writing Migrations

```kotlin
// Migration 1 → 2: adding a "notes" column to citations table
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // Raw SQL — Room does not help you here
        // Must match the ACTUAL change you made to the @Entity
        db.execSQL(
            "ALTER TABLE citations ADD COLUMN notes TEXT NOT NULL DEFAULT ''"
        )
        // IMPORTANT: SQLite ALTER TABLE can only ADD columns, never remove or rename
        // To rename a column or remove one:
        //   1. Create new table with correct schema
        //   2. Copy data from old table
        //   3. Drop old table
        //   4. Rename new table
    }
}

// Migration 2 → 3: renaming "status" column to "payment_status"
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(db: SupportSQLiteDatabase) {
        // SQLite < 3.25 doesn't support RENAME COLUMN directly
        // Safe approach: recreate the table
        db.execSQL("""
            CREATE TABLE citations_new (
                id TEXT NOT NULL PRIMARY KEY,
                citation_number TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_status TEXT NOT NULL,
                issued_date INTEGER NOT NULL,
                due_date INTEGER NOT NULL,
                description TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
                notes TEXT NOT NULL DEFAULT ''
            )
        """)
        db.execSQL("""
            INSERT INTO citations_new
            SELECT id, citation_number, amount, status, issued_date,
                   due_date, description, owner_id, sync_status, notes
            FROM citations
        """)
        db.execSQL("DROP TABLE citations")
        db.execSQL("ALTER TABLE citations_new RENAME TO citations")
    }
}

// Register in database builder:
Room.databaseBuilder(context, AppDatabase::class.java, "app_database")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()
```

### Testing Migrations — The Room Migration Test Library

```kotlin
// Requires:
// androidTestImplementation("androidx.room:room-testing:$roomVersion")

@RunWith(AndroidJUnit4::class)
class MigrationTest {

    private val TEST_DB = "migration-test"

    @get:Rule
    val helper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        AppDatabase::class.java
    )

    @Test
    fun migrate1To2_addsNotesColumn() {
        // Create database at version 1 (old schema)
        val db = helper.createDatabase(TEST_DB, version = 1)

        // Insert a row using version 1 schema (no notes column)
        db.execSQL("""
            INSERT INTO citations (id, citation_number, amount, status,
                                   issued_date, due_date, description, owner_id)
            VALUES ('CIT-001', 'CN-001', 150.0, 'PENDING', 1704067200000,
                    1706745600000, 'Test citation', 'USR-001')
        """)
        db.close()

        // Run migration 1 → 2
        val migratedDb = helper.runMigrationsAndValidate(TEST_DB, 2, true, MIGRATION_1_2)

        // Verify the data survived the migration
        val cursor = migratedDb.query("SELECT * FROM citations WHERE id = 'CIT-001'")
        assertThat(cursor.moveToFirst()).isTrue()

        // Verify new column exists with default value
        val notesIndex = cursor.getColumnIndex("notes")
        assertThat(notesIndex).isGreaterThan(-1)
        assertThat(cursor.getString(notesIndex)).isEqualTo("")

        // Verify existing data was preserved
        assertThat(cursor.getString(cursor.getColumnIndexOrThrow("id"))).isEqualTo("CIT-001")
        assertThat(cursor.getDouble(cursor.getColumnIndexOrThrow("amount"))).isEqualTo(150.0)

        cursor.close()
        migratedDb.close()
    }

    @Test
    fun migrate2To3_renamesStatusColumn() {
        val db = helper.createDatabase(TEST_DB, version = 2)
        db.execSQL("""
            INSERT INTO citations (id, citation_number, amount, status, issued_date,
                                   due_date, description, owner_id, sync_status, notes)
            VALUES ('CIT-001', 'CN-001', 150.0, 'PENDING', 1704067200000,
                    1706745600000, 'Test', 'USR-001', 'SYNCED', '')
        """)
        db.close()

        val migratedDb = helper.runMigrationsAndValidate(TEST_DB, 3, true, MIGRATION_2_3)

        val cursor = migratedDb.query("SELECT * FROM citations WHERE id = 'CIT-001'")
        cursor.moveToFirst()

        // Old column "status" should not exist:
        assertThat(cursor.getColumnIndex("status")).isEqualTo(-1)

        // New column "payment_status" should exist with the migrated data:
        val newColIndex = cursor.getColumnIndex("payment_status")
        assertThat(newColIndex).isGreaterThan(-1)
        assertThat(cursor.getString(newColIndex)).isEqualTo("PENDING")  // data preserved

        cursor.close()
        migratedDb.close()
    }
}
```

---

### 🎯 Practice — Room Migrations

**Scenario**: The team is releasing v2.5.0 which adds an `attachmentCount` column (Integer, default 0) to the `citations` table. The current schema is version 4. You are the QA engineer. What tests do you write and what edge cases do you check?

<details><summary>Answer</summary>

**Migration to write**:
```kotlin
val MIGRATION_4_5 = object : Migration(4, 5) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL(
            "ALTER TABLE citations ADD COLUMN attachment_count INTEGER NOT NULL DEFAULT 0"
        )
    }
}
```

**Tests to write**:

```kotlin
@Test
fun migrate4To5_addsAttachmentCountColumn() {
    // Create DB at version 4 with existing data
    val db = helper.createDatabase(TEST_DB, 4)
    db.execSQL("INSERT INTO citations (...) VALUES ('CIT-001', ...)")
    db.close()

    val migratedDb = helper.runMigrationsAndValidate(TEST_DB, 5, true, MIGRATION_4_5)

    val cursor = migratedDb.query("SELECT * FROM citations WHERE id = 'CIT-001'")
    cursor.moveToFirst()

    // 1. Column exists
    val colIndex = cursor.getColumnIndex("attachment_count")
    assertThat(colIndex).isGreaterThan(-1)

    // 2. Default value is 0 for existing rows
    assertThat(cursor.getInt(colIndex)).isEqualTo(0)

    // 3. All existing data preserved
    assertThat(cursor.getString(cursor.getColumnIndexOrThrow("id"))).isEqualTo("CIT-001")
    assertThat(cursor.getDouble(cursor.getColumnIndexOrThrow("amount"))).isEqualTo(expectedAmount)

    cursor.close()
    migratedDb.close()
}

@Test
fun migrate4To5_emptyDatabase_doesNotCrash() {
    // Migration on empty DB (fresh install → database version jumped from
    // nothing, but this test verifies no crash on edge case)
    val db = helper.createDatabase(TEST_DB, 4)
    db.close()
    val migratedDb = helper.runMigrationsAndValidate(TEST_DB, 5, true, MIGRATION_4_5)
    migratedDb.close()
    // Just verifying it doesn't throw — empty DB migration should be a no-op data-wise
}
```

**Edge cases to check (QA perspective)**:
1. **Existing user on v4 updates to v5** → migration runs → `attachment_count` = 0 for all old citations ✓
2. **Fresh install of v5** → migration never runs, fresh DB at v5 ✓
3. **User skips v4** (v3 → v5 path) → does Room support multi-step migrations? YES — Room chains them: `3→4→5`. Ensure both migrations are registered.
4. **Migration fails mid-way** → Room wraps in a transaction, but `ALTER TABLE` is DDL — in SQLite, DDL statements cannot be rolled back. Verify that a partial migration doesn't leave the DB in a corrupted state.
5. **Column name collision** → if `attachment_count` already exists (shouldn't happen, but test migration script defensively).

</details>

---

## 9. Room + Flow — Reactive Database

This is the most powerful pattern in Android data management:

```kotlin
// DAO returns a Flow:
@Dao
interface CitationDao {
    @Query("SELECT * FROM citations WHERE owner_id = :userId ORDER BY issued_date DESC")
    fun observeAllCitations(userId: String): Flow<List<CitationEntity>>
    // NOT suspend — the Flow is ongoing
}

// Repository exposes domain model Flow:
class CitationRepository(
    private val citationDao: CitationDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    fun observeAllCitations(userId: String): Flow<List<Citation>> =
        citationDao.observeAllCitations(userId)
            .map { entities -> entities.map { it.toDomain() } }
            .flowOn(dispatcher)  // all upstream work on IO thread
}

// ViewModel converts to StateFlow:
val citations: StateFlow<List<Citation>> =
    citationRepository.observeAllCitations(currentUserId)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())
```

### What Happens When Data Changes

```
User marks a citation as PAID:
  1. Repository calls: citationDao.updateCitationStatus(id, "PAID")
  2. Room updates the SQLite row
  3. Room's invalidation tracker detects the "citations" table was modified
  4. Room emits the new query result through the Flow automatically
  5. Repository's Flow emits: List<Citation> with updated status
  6. ViewModel's StateFlow updates with new list
  7. Compose's collectAsStateWithLifecycle() triggers recomposition
  8. CitationItem now shows "PAID" badge
  9. No manual refresh call needed anywhere in this chain
```

---

## 10. Testing Room (Integration Tests)

Room integration tests run on a real device or emulator with a real (in-memory) database:

```kotlin
@RunWith(AndroidJUnit4::class)
class CitationDaoTest {

    private lateinit var db: AppDatabase
    private lateinit var dao: CitationDao

    @Before
    fun setup() {
        db = Room.inMemoryDatabaseBuilder(
            ApplicationProvider.getApplicationContext(),
            AppDatabase::class.java
        )
            .allowMainThreadQueries()  // only in tests — never in production
            .build()
        dao = db.citationDao()
    }

    @After
    fun teardown() {
        db.close()
    }

    @Test
    fun insertAndGetById_returnsCorrectEntity() = runTest {
        val entity = CitationEntity(
            id = "CIT-001", citationNumber = "CN-001",
            amount = 150.0, status = "PENDING",
            issuedDate = System.currentTimeMillis(), dueDate = System.currentTimeMillis() + 86400000,
            description = "Test", ownerId = "USR-001"
        )
        dao.insertCitation(entity)

        val result = dao.getCitationById("CIT-001")

        assertNotNull(result)
        assertEquals("CIT-001", result!!.id)
        assertEquals(150.0, result.amount, 0.001)
        assertEquals("PENDING", result.status)
    }

    @Test
    fun insertWithOnConflictReplace_updatesExistingRow() = runTest {
        val original = CitationEntity(id = "CIT-001", amount = 150.0, status = "PENDING", ...)
        dao.insertCitation(original)

        val updated = original.copy(amount = 200.0, status = "PAID")
        dao.insertCitation(updated)  // REPLACE conflict → overwrites

        val result = dao.getCitationById("CIT-001")
        assertEquals(200.0, result!!.amount, 0.001)
        assertEquals("PAID", result.status)
    }

    @Test
    fun observeAllCitations_emitsNewValueOnInsert() = runTest {
        val userId = "USR-001"

        // Start collecting the Flow
        val results = mutableListOf<List<CitationEntity>>()
        val job = launch {
            dao.observeAllCitations(userId).collect { results.add(it) }
        }

        // Wait for initial emission
        advanceUntilIdle()
        assertEquals(1, results.size)
        assertTrue(results[0].isEmpty())

        // Insert data
        dao.insertCitation(CitationEntity(id = "CIT-001", ownerId = userId, ...))
        advanceUntilIdle()

        // Flow should have emitted again
        assertEquals(2, results.size)
        assertEquals(1, results[1].size)
        assertEquals("CIT-001", results[1][0].id)

        job.cancel()
    }

    @Test
    fun deleteAllForUser_onlyDeletesUsersCitations() = runTest {
        val user1 = "USR-001"
        val user2 = "USR-002"
        dao.insertCitation(CitationEntity(id = "CIT-001", ownerId = user1, ...))
        dao.insertCitation(CitationEntity(id = "CIT-002", ownerId = user1, ...))
        dao.insertCitation(CitationEntity(id = "CIT-003", ownerId = user2, ...))

        dao.deleteAllForUser(user1)

        assertNull(dao.getCitationById("CIT-001"))
        assertNull(dao.getCitationById("CIT-002"))
        assertNotNull(dao.getCitationById("CIT-003"))  // user2's citation untouched
    }
}
```

---

## 11. DataStore — Modern SharedPreferences

### Preferences DataStore (Key-Value, typesafe)

```kotlin
// Define the keys and their types:
object UserPreferencesKeys {
    val IS_DARK_MODE_ENABLED = booleanPreferencesKey("is_dark_mode_enabled")
    val SELECTED_LANGUAGE    = stringPreferencesKey("selected_language")
    val NOTIFICATION_ENABLED = booleanPreferencesKey("notification_enabled")
    val LAST_SYNC_TIMESTAMP  = longPreferencesKey("last_sync_timestamp")
    val ONBOARDING_COMPLETE  = booleanPreferencesKey("onboarding_complete")
}

// Create the DataStore (singleton — one per file name):
val Context.userPreferencesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "user_preferences"
)
// File location: /data/data/com.myapp/files/datastore/user_preferences.preferences_pb

// Repository wrapping DataStore:
class UserPreferencesRepository(
    private val dataStore: DataStore<Preferences>
) {
    // Read: returns a Flow — reactive, like Room
    val isDarkModeEnabled: Flow<Boolean> = dataStore.data
        .catch { exception ->
            // If DataStore file is corrupted → emit default and log
            if (exception is IOException) {
                emit(emptyPreferences())
            } else throw exception
        }
        .map { preferences ->
            preferences[UserPreferencesKeys.IS_DARK_MODE_ENABLED] ?: false  // default
        }

    val selectedLanguage: Flow<String> = dataStore.data
        .map { it[UserPreferencesKeys.SELECTED_LANGUAGE] ?: "en" }

    // Write: suspending function
    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { preferences ->
            preferences[UserPreferencesKeys.IS_DARK_MODE_ENABLED] = enabled
        }
        // dataStore.edit is atomic — either all changes apply or none
    }

    suspend fun markOnboardingComplete() {
        dataStore.edit { it[UserPreferencesKeys.ONBOARDING_COMPLETE] = true }
    }

    suspend fun updateLastSyncTime(timestamp: Long) {
        dataStore.edit { it[UserPreferencesKeys.LAST_SYNC_TIMESTAMP] = timestamp }
    }

    // Read a single value (not reactive — for one-time reads):
    suspend fun isOnboardingComplete(): Boolean {
        return dataStore.data.first()[UserPreferencesKeys.ONBOARDING_COMPLETE] ?: false
    }
}
```

### DataStore vs SharedPreferences — The Critical Differences

```
SharedPreferences:
  - Reads can block the main thread (ANR risk)
  - Writes with apply() are fire-and-forget (no error handling)
  - Not safe for concurrent access
  - Can corrupt data during crashes
  - No Flow support — no reactivity without custom wrappers

DataStore:
  - All operations are suspend functions or Flow (never blocks main thread)
  - Atomic transactions (edit { } is all-or-nothing)
  - Handles concurrent access correctly
  - Survives process crashes (writes are flushed before process dies)
  - Flow: reactive — observers notified on every change

RULE: Use DataStore for all new preferences code.
      Migrate SharedPreferences to DataStore when touching those files.
```

---

## 12. What Persists — The Definitive Table

This is one of the most important tables for both development and QA:

```
DATA TYPE              SURVIVES ROTATION?  SURVIVES PROCESS DEATH?  SURVIVES APP RESTART?
─────────────────────  ─────────────────   ───────────────────────  ─────────────────────
Activity instance var  NO (Activity dies)  NO                        NO
ViewModel (in-memory)  YES                 NO                        NO
ViewModel+SavedState   YES                 YES (if Bundle < 1MB)     NO
onSaveInstanceState    YES                 YES (if Bundle < 1MB)     NO
SharedPreferences      YES                 YES                       YES
DataStore              YES                 YES                       YES
Room Database          YES                 YES                       YES
Files on disk          YES                 YES                       YES
In-memory cache        YES*                NO                        NO
                       (*if in ViewModel)
```

**QA tests for this table**:
```
Test 1 (Rotation):
  Developer Options: Don't keep activities OFF
  Fill form → Rotate device
  Expected: Data in rememberSaveable/ViewModel survives

Test 2 (Process death):
  Developer Options: Don't keep activities ON
  Fill form → Press Home → Return to app
  Expected: Data in rememberSaveable/SavedStateHandle survives

Test 3 (App restart):
  Fill form → Force-close app → Reopen
  Expected: Only Room/DataStore/file data survives
            ViewModel data is GONE (start fresh) — correct behavior
            rememberSaveable data is GONE — correct behavior
```

---

## 13. Common Room Bugs and Their Tests

### Bug 1: Query on Main Thread (No Suspend)

```kotlin
// WRONG — calling a non-suspend DAO function:
fun loadCitationSync(): CitationEntity? {
    return citationDao.getCitationByIdSync("CIT-001")  // non-suspend, runs synchronously
    // → IllegalStateException: "Cannot access database on the main thread since it may
    //   potentially lock the UI for a long period of time."
}

// CORRECT:
suspend fun loadCitation(): CitationEntity? {
    return citationDao.getCitationById("CIT-001")  // suspend — runs on Room's IO thread
}
```

**QA test**: Any screen that crashes with `IllegalStateException: Cannot access database on the main thread` — the repository or DAO call is not using suspend or Flow.

### Bug 2: Missing Migration → Crash on Update

```
Symptom: App crashes ONLY for users who had version N-1 installed.
         Fresh installs work fine.
Logcat:  "IllegalStateException: Room cannot verify the data integrity.
          Looks like you've changed schema but forgot to update the version number.
          OR you need to provide a Migration."
Fix:     Add the migration or increment version + provide migration.
```

### Bug 3: Flow Collected Outside Lifecycle → Memory Leak

```kotlin
// WRONG — collected in ViewModel without cancellation:
class CitationListViewModel : ViewModel() {
    init {
        // This launches a coroutine that runs FOREVER — never cancelled
        GlobalScope.launch {  // GlobalScope = not cancelled when ViewModel dies
            citationDao.observeAllCitations("user-1").collect { ... }
        }
    }
}

// CORRECT — use viewModelScope:
init {
    viewModelScope.launch {
        citationDao.observeAllCitations("user-1").collect { ... }
        // Cancelled when ViewModel.onCleared() is called
    }
}
```

---

## 14. Interview Q&A

**Q: "What is Room and why use it instead of raw SQLite?"**
> "Room is Google's persistence library, a high-level abstraction over SQLite. The primary advantage over raw SQLite is compile-time verification of SQL queries — if you write a query referencing a column that doesn't exist, the build fails, not the app at runtime. Room also eliminates the boilerplate of `Cursor` management, reduces the risk of SQL injection (queries use named parameters), and has first-class support for Kotlin coroutines via suspend functions and Flow. The Flow integration is particularly powerful — a DAO query that returns `Flow<List<T>>` automatically re-emits new data whenever the underlying table changes, enabling reactive UIs without any manual refresh calls."

**Q: "What is a Room migration and what happens if you don't provide one?"**
> "A migration is code that transforms the database schema from one version to another when a user updates the app. When you add a column or change a table, you increment the `version` number in `@Database` and provide a `Migration` object with the SQL to alter the schema. If you don't provide one and the version number changes, Room throws an `IllegalStateException` — the app crashes on launch for all users who had the previous version. The worst 'fix' is `fallbackToDestructiveMigration()`, which drops and recreates the database — all user data is lost. Migrations must be tested against production-like data using Room's `MigrationTestHelper` in instrumented tests."

**Q: "What is the difference between SharedPreferences and DataStore?"**
> "SharedPreferences is the legacy API for key-value storage. Its problems: reads can block the main thread (ANR risk), `apply()` writes are fire-and-forget with no error feedback, and it's not safe for concurrent access, leading to occasional data corruption. DataStore is the modern replacement. All operations are either `suspend` functions or `Flow` — never blocking. Writes use `edit { }` which is atomic — either all changes in a transaction commit or none do. DataStore handles concurrent access correctly and flushes writes before the process dies. I use DataStore for all new preference code and migrate SharedPreferences code when I touch those files."

---

**Next in this folder**: [06_Networking_Retrofit_OkHttp.md](./06_Networking_Retrofit_OkHttp.md) — Retrofit API setup, interceptors, authentication, certificate pinning, and testing network calls with MockWebServer.

**Back to**: [Android folder index](./) | [Series index](../)
