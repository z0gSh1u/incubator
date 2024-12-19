import router from "@ohos.router"
import webview from '@ohos.web.webview';
import dataPreferences from '@ohos.data.preferences'
import { GlobalContext } from '../common/GlobalContext'

// Mock Data
interface TodoItemData {
  isComplete: boolean,
  itemValue: string
}
const todoItemDatas: TodoItemData[] = [
  { isComplete: false, itemValue: "学完鸿蒙开发" },
  { isComplete: true, itemValue: "起床" },
  { isComplete: false, itemValue: "赚到一千万" },
]

@Entry
@Component
struct Index {
  @State currentTab: number = 0
  @State videoSrc: string = "https://www.runoob.com/try/demo_source/mov_bbb.mp4"

  build() {
    Tabs({ barPosition: BarPosition.End }) {
      TabContent() {
        ToDoFeature()
      }.tabBar("Main")
      TabContent() {
        VideoFeature({ videoSrc: this.videoSrc, currentTab: $currentTab })
      }.tabBar("Video")
    }.onChange((targetTab) => {
      // console.log("", targetTab)
      this.currentTab = targetTab
    })
  }
}

@Component
struct VideoFeature {
  @Prop videoSrc: string
  @Link @Watch("onTabChange") currentTab: number

  videoController: VideoController = new VideoController()

  onTabChange() {
    if (this.currentTab != 1) {
      this.videoController.pause()
    }
  }

  build() {
    Column() {
      Video({
        src: this.videoSrc,
        controller: this.videoController
      })
    }
  }
}

@Component
struct ToDoFeature {
  @State fontsize: number = -1
  @State todologoWidth: number = 64
  webController: webview.WebviewController = new webview.WebviewController()

  // async dowhat2() {
  //   return new Promise((resolve) => resolve(0))
  // }
  // async dowhat (){
  //   await this.dowhat2()
  //   console.log("async triggered")
  // }

  build() {
    Column() {
      Text("Get MyFontSize")
      Text(this.fontsize.toString())
      Button("Fetch MyFontSize").onClick(async () => {
        // const prefs = GlobalContext.getContext().getObject("GlobalPreferences") as dataPreferences.Preferences
        const prefs = globalThis.prefs!
        console.log("prefs", prefs)
        this.fontsize = +(await prefs.get("MyFontSize", -1))
      })

      // Web({
      //   src: "https://www.runoob.com/try/try.php?filename=tryjs_events",
      //   controller: this.webController
      // }).javaScriptAccess(true).fileAccess(true).onlineImageAccess(true).domStorageAccess(true)
      //   .zoomAccess(true).wideViewModeAccess(true)

      Image($r("app.media.todologo")).width(this.todologoWidth).height(64).animation({
        duration: 1000,
        tempo: 1.0,
        delay: 0,
        curve: Curve.Linear,
        playMode: PlayMode.Normal,
        iterations: 1
      })

      Button("Animation").onClick((event: ClickEvent) => {
        this.todologoWidth = this.todologoWidth == 128 ? 64 : 128
        // this.dowhat()
      })

      Text('ToDo').fontSize(32).fontWeight('bold').margin({
        bottom: 16
      })

      Button("About").onClick(() => {
        router.pushUrl({
          url: "pages/AboutPage"
        })
      })

      ForEach(todoItemDatas, (item) => {
        ToDoItem(item)
      })

      Divider()


    }
    .padding({
      top: 16,
      left: 16,
      bottom: 16,
      right: 16
    })
    .width('100%')
    .height('100%')
    .alignItems(HorizontalAlign.Start)
    .backgroundColor('rgb(255,255,228)')
  }
}

@Component
struct ToDoItem {
  @State isComplete: boolean = false
  @State itemValue: string = ""

  build() {
    Row() {
      Text(this.isComplete ? "√" : "×").fontSize(32)
      Text("|").margin({
        left: 16,
        right: 16
      })
      Text(this.itemValue).fontSize(24).onClick(() => (this.isComplete = !this.isComplete))
    }.margin({
      top: 8,
      bottom: 8
    })
  }
}