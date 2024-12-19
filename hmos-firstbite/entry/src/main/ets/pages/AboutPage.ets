import router from '@ohos.router';

@Entry
@Component
struct About {
  build() {
    Column() {
      Button("Back").onClick(() => {
        router.back()
      })
      Blank().margin({bottom: 12})
      Text("HMOS Demo App, 2024/02").fontSize(24)
    }.padding(24).width("100%")
  }
}