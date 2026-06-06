# 🔨 Mini-Project P04 — Library Management REST API

> **Semester:** 2, Weeks 6-8  
> **Topics:** Spring Boot 3 · JPA · Spring Security · JWT · JUnit 5 + MockMvc  
> **Est. time:** 8–10 hours  
> **Language:** Java 17

---

## 🎯 Business Requirement (The PM Brief)

*A regional library network wants to modernize their catalog system. They need a REST API that librarians and members can use from any device. You are the sole backend engineer for v1.*

---

## 📋 Technical Specification

### Domain Entities

| Entity | Key Fields | Notes |
|---|---|---|
| `Member` | id, name, email, password, role (LIBRARIAN/MEMBER), joinDate | Authentication principal |
| `Book` | id, title, isbn, authorName, category, totalCopies, availableCopies | Core asset |
| `Loan` | id, bookId, memberId, loanDate, dueDate, returnDate, status (ACTIVE/RETURNED/OVERDUE) | Business transaction |

### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register new member |
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/books` | Any | Search books (by title, author, category) with pagination |
| GET | `/api/books/{id}` | Any | Get book detail |
| POST | `/api/books` | LIBRARIAN | Add new book |
| PUT | `/api/books/{id}` | LIBRARIAN | Update book details |
| DELETE | `/api/books/{id}` | LIBRARIAN | Remove book |
| POST | `/api/loans` | MEMBER | Borrow a book |
| PUT | `/api/loans/{id}/return` | MEMBER | Return a book |
| GET | `/api/loans/my` | MEMBER | My loan history |
| GET | `/api/loans/overdue` | LIBRARIAN | All overdue loans |

### Business Rules (Invariants)
- A member cannot borrow the same book twice while one loan is ACTIVE
- A book cannot be borrowed if `availableCopies == 0`
- `dueDate` = `loanDate + 14 days`
- A loan becomes OVERDUE if `returnDate == null AND dueDate < today`
- LIBRARIAN can manage books; MEMBER can only borrow/return

### Acceptance Criteria
- [ ] All endpoints return proper HTTP status codes (200, 201, 400, 401, 403, 404, 409)
- [ ] JWT tokens expire in 24 hours
- [ ] Passwords are stored hashed (BCrypt)
- [ ] Pagination: `GET /api/books?page=0&size=20&sort=title`
- [ ] Input validation: `@Valid` on all request DTOs
- [ ] Global exception handler returning RFC 7807 problem details

---

## 🏗️ Project Structure

```
library-api/
├── src/main/java/com/library/
│   ├── LibraryApiApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   └── JwtConfig.java
│   ├── domain/
│   │   ├── member/
│   │   │   ├── Member.java          (Entity)
│   │   │   ├── MemberRepository.java
│   │   │   ├── MemberService.java
│   │   │   └── MemberController.java (auth endpoints)
│   │   ├── book/
│   │   │   ├── Book.java            (Entity)
│   │   │   ├── BookRepository.java
│   │   │   ├── BookService.java
│   │   │   └── BookController.java
│   │   └── loan/
│   │       ├── Loan.java            (Entity)
│   │       ├── LoanStatus.java      (Enum)
│   │       ├── LoanRepository.java
│   │       ├── LoanService.java
│   │       └── LoanController.java
│   ├── dto/
│   │   ├── BookRequest.java
│   │   ├── BookResponse.java
│   │   ├── LoanResponse.java
│   │   ├── AuthRequest.java
│   │   └── AuthResponse.java
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java
│   │   ├── BookNotFoundException.java
│   │   ├── NoAvailableCopiesException.java
│   │   └── DuplicateLoanException.java
│   └── security/
│       ├── JwtService.java
│       ├── JwtAuthFilter.java
│       └── UserDetailsServiceImpl.java
├── src/test/java/com/library/
│   ├── book/BookControllerTest.java
│   ├── loan/LoanServiceTest.java
│   └── integration/LibraryIntegrationTest.java
├── src/main/resources/
│   └── application.yml
└── pom.xml
```

---

## 📝 Skeleton Code

### Book.java (Entity)
```java
package com.library.domain.book;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    private String title;
    
    @NotBlank
    @Column(unique = true)
    private String isbn;
    
    @NotBlank
    private String authorName;
    
    private String category;
    
    @Min(0)
    private int totalCopies;
    
    @Min(0)
    private int availableCopies;
    
    // TODO: add @CreatedDate, @LastModifiedDate with @EnableJpaAuditing
    
    /**
     * Domain method: decrements available copies atomically.
     * Throws if no copies available.
     * @throws NoAvailableCopiesException if availableCopies == 0
     */
    public void checkout() {
        // TODO: enforce business invariant here — NOT in service
    }
    
    /**
     * Domain method: increments available copies on return.
     * @throws IllegalStateException if availableCopies already == totalCopies
     */
    public void returnCopy() {
        // TODO
    }
    
    // getters only — no public setters for domain state
}
```

### LoanService.java
```java
package com.library.domain.loan;

import com.library.domain.book.*;
import com.library.domain.member.*;
import com.library.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class LoanService {
    
    private final LoanRepository loanRepo;
    private final BookRepository bookRepo;
    private final MemberRepository memberRepo;
    
    /**
     * Borrows a book for the authenticated member.
     * Business rules enforced here + inside Book.checkout()
     */
    @Transactional
    public Loan borrowBook(Long bookId, Long memberId) {
        // TODO: 1. Load book — throw BookNotFoundException if absent
        // TODO: 2. Load member
        // TODO: 3. Check for duplicate active loan — throw DuplicateLoanException
        // TODO: 4. Call book.checkout() — it throws if no copies
        // TODO: 5. Create Loan with status=ACTIVE, loanDate=today, dueDate=today+14
        // TODO: 6. Save loan + save book (availableCopies updated)
        // TODO: 7. Return saved loan
        return null;
    }
    
    /**
     * Returns a borrowed book.
     */
    @Transactional
    public Loan returnBook(Long loanId, Long memberId) {
        // TODO: 1. Load loan — throw if absent
        // TODO: 2. Verify loan belongs to this member — throw 403 if not
        // TODO: 3. Check loan status is ACTIVE — throw if already RETURNED
        // TODO: 4. Set returnDate=today, status=RETURNED
        // TODO: 5. Call book.returnCopy()
        // TODO: 6. Save both
        return null;
    }
    
    /**
     * Returns all loans where dueDate < today AND returnDate is null.
     * Updates their status to OVERDUE.
     */
    @Transactional
    public void markOverdueLoans() {
        // TODO: loanRepo.findByStatusAndDueDateBefore(ACTIVE, LocalDate.now())
        //       then update each to OVERDUE
    }
}
```

### GlobalExceptionHandler.java
```java
package com.library.exception;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BookNotFoundException.class)
    public ProblemDetail handleNotFound(BookNotFoundException ex) {
        // TODO: return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage())
        return null;
    }
    
    @ExceptionHandler(NoAvailableCopiesException.class)
    public ProblemDetail handleNoAvailableCopies(NoAvailableCopiesException ex) {
        // TODO: 409 CONFLICT
        return null;
    }
    
    @ExceptionHandler(DuplicateLoanException.class)
    public ProblemDetail handleDuplicate(DuplicateLoanException ex) {
        // TODO: 409 CONFLICT
        return null;
    }
    
    // TODO: handle MethodArgumentNotValidException → 400 with field errors
    // TODO: handle AccessDeniedException → 403
}
```

---

## ✅ JUnit Test Stubs

### BookControllerTest.java (MockMvc — Unit Test)
```java
@WebMvcTest(BookController.class)
@Import(SecurityConfig.class)
class BookControllerTest {
    
    @Autowired MockMvc mockMvc;
    @MockBean BookService bookService;
    @Autowired ObjectMapper mapper;
    
    @Test
    @WithMockUser(roles = "LIBRARIAN")
    void createBook_withValidData_returns201() throws Exception {
        var req = new BookRequest("Clean Code", "978-0-13-235088-4", "Robert Martin", "Engineering", 5);
        when(bookService.create(any())).thenReturn(sampleBook());
        
        mockMvc.perform(post("/api/books")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("Clean Code"));
    }
    
    @Test
    @WithMockUser(roles = "MEMBER")
    void createBook_asMember_returns403() throws Exception {
        // TODO: MEMBER role → expect 403 Forbidden
    }
    
    @Test
    void createBook_unauthenticated_returns401() throws Exception {
        // TODO: no auth → expect 401 Unauthorized
    }
    
    @Test
    @WithMockUser
    void getBook_notFound_returns404() throws Exception {
        // TODO: bookService.findById throws BookNotFoundException → expect 404
    }
}
```

### LoanServiceTest.java (Unit Test)
```java
@ExtendWith(MockitoExtension.class)
class LoanServiceTest {
    
    @InjectMocks LoanService loanService;
    @Mock LoanRepository loanRepo;
    @Mock BookRepository bookRepo;
    @Mock MemberRepository memberRepo;
    
    @Test
    void borrowBook_success() {
        // TODO: mock bookRepo.findById → available book
        //       mock loanRepo.existsActiveLoan → false
        //       call borrowBook → verify loan saved with ACTIVE status
    }
    
    @Test
    void borrowBook_noAvailableCopies_throwsException() {
        // TODO: book.availableCopies = 0 → expect NoAvailableCopiesException
    }
    
    @Test
    void borrowBook_duplicateActiveLoan_throwsException() {
        // TODO: loanRepo.existsActiveLoan = true → expect DuplicateLoanException
    }
    
    @Test
    void returnBook_wrongMember_throwsForbidden() {
        // TODO: loan.memberId != authenticatedMemberId → expect AccessDeniedException
    }
}
```

---

## 🔴 Failure Scenarios & Erklärungen

| Mistake | Why It Happens | The Fix |
|---|---|---|
| `book.setAvailableCopies(book.getAvailableCopies() - 1)` in service | Anemic domain model — logic leaks into service | Move to `book.checkout()` domain method which enforces invariants |
| No `@Transactional` on `borrowBook()` | Book and Loan saved in separate transactions → partial state possible | Always `@Transactional` when modifying multiple entities |
| Storing plain text password | Security catastrophe | Use `BCryptPasswordEncoder` — Spring Security provides it |
| JWT secret as `"secret"` in properties | Easily brute-forced | Generate a strong 256-bit key, store in env variable never in source |
| Returning JPA entity directly from controller | Exposes internal fields, causes `LazyInitializationException` on serialization | Always use DTO (Record or class) as API response — map entity → DTO |
| `@OneToMany` on Loan without `FetchType.LAZY` | Loads ALL loans when loading a Book → N+1 catastrophe | Always `LAZY` fetch; load explicitly when needed with `JOIN FETCH` |
| `@ExceptionHandler` in controller (not `@ControllerAdvice`) | Only handles exceptions for THAT controller | Use `@RestControllerAdvice` for global exception handling |

---

## 🚀 Extension Challenges

1. **Email notifications:** Send email when a loan is created or becomes overdue (use Spring Mail + async `@EventListener`)
2. **Fine calculation:** Add a `fine` field to Loan — 5 rupees/day after due date
3. **Book reservation:** Allow members to reserve a book when `availableCopies == 0` — notify when available
4. **Audit log:** Add `@CreatedBy`, `@LastModifiedBy` using Spring Data JPA auditing with JWT-extracted user
5. **Rate limiting:** Limit borrowing to 5 active loans per member

---

## 📊 Self-Assessment Rubric

| Criterion | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| All 11 endpoints implemented | <5 | 5-7 | 8-10 | 11 + validation |
| JWT auth working end-to-end | Not started | Login works, no guard | Guards work, wrong roles | Full RBAC correct |
| Business rules enforced | In controller | In service | In domain entity | + unit tested |
| Error handling | 500 for everything | Some errors handled | RFC 7807 for all | + validation errors |
| Test coverage | No tests | Some unit tests | Unit + MockMvc | Unit + MockMvc + Integration |

---

[← Back to Semester 2 Guide](../../00_CURRICULUM/SEMESTER_2_GUIDE.md)
