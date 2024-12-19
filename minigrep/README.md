# minigrep

The `grep` like tool written in Rust following [rustwiki.org/zh-CN/book/ch12-00-an-io-project.html](https://rustwiki.org/zh-CN/book/ch12-00-an-io-project.html) .

```sh
$ cargo build
$ cat poem.txt
  # How dreary to be somebody!
  # How public, like a frog
$ minigrep rog poem.txt
  # How public, like a frog
```