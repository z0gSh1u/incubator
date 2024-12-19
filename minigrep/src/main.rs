use std::env;

use minigrep::Config;

fn main() {
    // Usage: minigrep <query> <filename>
    let args: Vec<String> = env::args().collect();

    let config = Config::new(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {}", err);
        std::process::exit(1);
    });

    if let Err(e) = minigrep::execute(config) {
        eprintln!("Application error: {}", e);
        std::process::exit(1);
    }
}
