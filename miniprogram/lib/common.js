function upload() {
  var self = this;
  wx.chooseImage({
    count: 1,
    sizeType: ["original"],
    success: function (res) {
      var filePath = res.tempFilePaths[0];
      console.log("filepath", filePath);
      // wx.setStorageSync('tempPath', filePath);
      wx.setStorage({
        key: "tempPath",
        data: filePath,
        success: function () {
          wx.navigateTo({
            url: "../upload/upload"
          });
        }
      });
    }
  });
}