//index.js
const app = getApp();

const loginUtils = require("../../lib/handleLogin.js");
const common = require("../../lib/common.js");
const { request, $request } = require("../../lib/request");

let db;

Array.prototype.unique = function() {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }

  return a;
};

function refresh(self, options = {}) {
  // db.collection("photos")
  // .get()
  // .then(res => {
  //   console.log("fetch", res.data);
  //   self.setData({
  //     photos: res.data
  //   });
  // });
  console.log("refresh");
  var userinfo = wx.getStorageSync("userinfo");
  if (options && !options.latitude) {
    var { latitude, longitude } = wx.getStorageSync("location");
    console.log("set location in refresh", options, latitude, longitude);
    options.latitude = latitude;
    options.longitude = longitude;
  }
  wx.showLoading();
  return $request({
    url: `/user/${userinfo._id}/home`,
    method: "GET",
    data: options
  })
    .then(res => {
      console.log("home", res.data);
      // process data
      const photos = res.data.map(photo => {
        let distant;
        if (photo.distant > 1000) {
          distant = (photo.distant / 1000).toFixed(1) + " km";
        } else {
          distant = photo.distant.toFixed(0) + " m";
        }
        return Object.assign(photo, {
          isLikedByMe: false,
          distant
        });
      });
      // end
      self.setData({
        photos
      });

      let tags = calcTags(res);
      // if (self.data.allTags.length > tags.length && tags.length < 5) {
      //   tags = tags.concat(self.data.allTags.slice(0, 5)).unique();
      // }
      self.setData({
        tags,
        showExpand: true
      });

      wx.hideLoading();
      return res;
    })
    .catch(() => {
      wx.showToast({
        title: "网络错误，稍后再来。",
        icon: "none"
      });
      wx.hideLoading();
    });

  // request({
  //   url: `/user/${userinfo._id}/home`,
  //   method: "GET",
  //   data: options,
  //   success: res => {},
  //   fail: res => {
  //     console.log("fail", res);
  //     wx.showToast({
  //       title: "网络错误，稍后再来。"
  //     });
  //   },
  //   complete: function() {
  //     wx.hideLoading();
  //   }
  // });
}

function calcTags(res, calcAll = false) {
  var tags = [];
  var tagsCollection = {};
  res.data.forEach(photo => {
    photo.tags.forEach(tag => {
      // if (tags.indexOf(tag) === -1) {
      //   tags.push(tag);
      // }
      if (tagsCollection[tag]) {
        tagsCollection[tag] += 1;
      } else {
        tagsCollection[tag] = 1;
      }
    });
    // tags = tags.concat(photo.tags);
  });
  console.log("tags", tagsCollection);
  tags = Object.keys(tagsCollection).sort((p, n) => {
    return tagsCollection[n] - tagsCollection[p];
  });
  if (!calcAll) {
    tags = tags.slice(0, 15);
  }
  return tags;
}

Page({
  data: {
    avatarUrl: "./user-unlogin.png",
    userInfo: {},
    logged: false,
    takeSession: false,
    requestResult: "",
    canIUse: wx.canIUse("button.open-type.getUserInfo"),
    selectedLocation: wx.getStorageSync("selectedLocation") || {},
    currentGeo: wx.getStorageSync("location") || null,
    currentTag: null,
    tags: [],
    allTags: [],
    photos: [],
    showExpand: true
  },

  onPullDownRefresh: function() {
    wx.showNavigationBarLoading();
    wx.stopPullDownRefresh();
    var self = this;

    var options = {};
    if (this.data.selectedLocation.lantitude) {
      options.latitude = this.data.selectedLocation.latitude;
      options.longitude = this.data.selectedLocation.longitude;
    }
    if (this.data.currentTag) {
      options.tag = this.data.currentTag;
    }
    refresh(self, options);
  },

  onTapHome: function() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  onShow: function() {
    var self = this;
    var savedLocation = wx.getStorageSync("selectedLocation") || {};
    var savedTag = wx.getStorageSync("currentTag") || "";
    console.log("current location", savedLocation);
    if (savedLocation.name !== this.data.selectedLocation.name) {
      this.setData({
        selectedLocation: savedLocation
      });
    }
    if (savedTag !== this.data.currentTag) {
      this.setData({
        currentTag: savedTag
      });
    }
    if (!db) {
      db = wx.cloud.database();
    }
    var shouldReload = true;
    // getApp().globalData.shouldReloadFeed;
    if (shouldReload) {
      console.log("saved location", savedLocation);
      refresh(self, {
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude
      }).then(res => {
        let allTags = calcTags(res, true);
        self.setData({
          allTags
        });
      });
      getApp().globalData.shouldReloadFeed = false;
    }

    // db.collection("locations")
    //   .where({
    //     name: this.data.currentLocation
    //   })
    //   .get()
    //   .then(res => {
    //     console.log("fetch locations (home)", res.data);
    //     if (res.data) {
    //       this.setData({
    //         tags: res.data[0].tags
    //       });
    //     }
    //   });
    var wxUserInfo = wx.getStorageSync("wechat_userinfo");
    console.log("wechat userinfo", wxUserInfo);
  },

  onLoad: function() {
    console.log("location", this.data.currentGeo);
    loginUtils.login(function() {
      console.log("login");
    });

    if (!wx.cloud) {
      wx.redirectTo({
        url: "../chooseLib/chooseLib"
      });
      return;
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting["scope.userInfo"]) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo
              });
            }
          });
        }
      }
    });

    function getLocation() {
      wx.getLocation({
        type: "wgs84",
        success(res) {
          console.log("geo", res);
          wx.setStorageSync("location", {
            latitude: res.latitude,
            longitude: res.longitude
          });
        }
      });
    }

    // 获取地理位置
    wx.getSetting({
      success: res => {
        if (res.authSetting["scope.userLocation"]) {
          getLocation();
        } else {
          wx.authorize({
            scope: "scope.userLocation",
            success() {
              getLocation();
            }
          });
        }
      }
    });

    // db = wx.cloud.database();
    // db.collection("images")
    //   .get()
    //   .then(res => {
    //     console.log("fetch", res.data);
    //     this.setData({
    //       photos: res.data
    //     });
    //   });
  },

  onGetUserInfo: function(e) {
    if (!this.logged && e.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: e.detail.userInfo.avatarUrl,
        userInfo: e.detail.userInfo
      });
    }
  },

  onNavigateToSearch: function() {
    wx.navigateTo({
      url: "../search/page"
    });
  },

  onTapTag: function(e) {
    var tag = e.target.dataset.tag;
    console.log("tap on tag", tag, this.data.currentTag);
    // TODO
    // wx.request({
    //   url: 'https://dejavu.duozhuayu.net/api-py/v1/',
    // })
    // var photos = this.data.photos.filter(photo => photo.tags.indexOf(tag) > 0);
    // this.setData({
    //   photos
    // });
    if (this.data.currentTag === tag) {
      this.setData({
        currentTag: ""
      });
      refresh(this);
    } else {
      this.setData({
        currentTag: tag
      });
      refresh(this, { tag });
    }
  },
  onTapExpandTag: function(e) {
    this.setData({
      tags: this.data.allTags,
      showExpand: false
    });
  },
  onTapLike: function(e) {
    e.stopPropagation();
    console.log("tap like", e);
    var postId = e.currentTarget.dataset.id;
    var targetPhoto = this.data.photos.filter(photo => photo._id === postId)[0];
    const photos = this.data.photos.map(photo => {
      if (photo._id === postId) {
        photo.isLikedByMe = true;
      }
      return photo;
    });
    this.setData({
      photos
    });
    console.log("tap on post", postId, targetPhoto);
    request({
      url: "/got",
      method: "POST",
      data: {
        post_id: postId
      },
      success: () => {}
    });
  },
  onTapComment: function(e) {
    const pid = e.currentTarget.dataset.id;
    if (pid) {
      wx.navigateTo({
        url: `../post/post?id=${pid}`
      });
    }
  },

  onOpenCamera: function() {
    var self = this;
    wx.chooseImage({
      count: 1,
      sizeType: ["original"],
      success: function(res) {
        var filePath = res.tempFilePaths[0];
        console.log("filepath", filePath);
        // wx.setStorageSync('tempPath', filePath);
        wx.setStorage({
          key: "tempPath",
          data: filePath,
          success: function() {
            wx.navigateTo({
              url: "../upload/upload"
            });
          }
        });
      }
    });
  },

  onGetOpenid: function() {
    // 调用云函数
    wx.cloud.callFunction({
      name: "login",
      data: {},
      success: res => {
        console.log("[云函数] [login] user openid: ", res.result.openid);
        app.globalData.openid = res.result.openid;
        wx.navigateTo({
          url: "../userConsole/userConsole"
        });
      },
      fail: err => {
        console.error("[云函数] [login] 调用失败", err);
        wx.navigateTo({
          url: "../deployFunctions/deployFunctions"
        });
      }
    });
  },

  onShareAppMessage: function () { },
  // 上传图片
  doUpload: function() {
    // 选择图片
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: function(res) {
        wx.showLoading({
          title: "上传中"
        });

        const filePath = res.tempFilePaths[0];

        // 上传图片
        const cloudPath = "my-image" + filePath.match(/\.[^.]+?$/)[0];
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: res => {
            console.log("[上传文件] 成功：", res);

            app.globalData.fileID = res.fileID;
            app.globalData.cloudPath = cloudPath;
            app.globalData.imagePath = filePath;

            wx.navigateTo({
              url: "../storageConsole/storageConsole"
            });
          },
          fail: e => {
            console.error("[上传文件] 失败：", e);
            wx.showToast({
              icon: "none",
              title: "上传失败"
            });
          },
          complete: () => {
            wx.hideLoading();
          }
        });
      },
      fail: e => {
        console.error(e);
      }
    });
  }
});
