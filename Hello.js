const add = (a,b)=> a+b


const fib = (a,b)=>{
    let c=a+b;
    console.log(c);
}

fib(0,1);


const factorial = function fact(n) {
    return n <= 1 ? 1 : n * fact(n - 1); // fact is only visible inside
};

console.log(factorial(5))


const user = (name, role = "viewer", active = true) =>{
    return { name, role, active };
}

console.log(user("srihari"))