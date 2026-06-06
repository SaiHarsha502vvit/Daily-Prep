public class Main {

    static {
        System.out.println(".class Loaded");
    }

    public Main() {
        System.out.println("Into constructor...");
    }

    {
        System.out.println("Object created ...");
    }

    public static void main(String[] args) {
        Main a = new Main();
    }
}