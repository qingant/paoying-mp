//index.js
const app = getApp();

const loginUtils = require("../../lib/handleLogin.js");
const common  = require("./common.js");
const { request, $request } = require("../../lib/request");

let db;
let refresh = common.refresh;
let calcTags = common.calcTags;

Array.prototype.unique = function() {
  var a = this.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j]) a.splice(j--, 1);
    }
  }

  return a;
};


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
    currentTag: '',
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
    var selectedLocation = wx.getStorageSync('selectedLocation')
    if (selectedLocation.latitude) {
      options.latitude = selectedLocation.latitude;
      options.longitude = selectedLocation.longitude;
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
    wx.setStorageSync('selectedLocation', {})
    
    this.setData({
      currentTag: '',
      selectedLocation: {}
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
    };
    getLocation();
    refresh(this);
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
    var shouldReload = getApp().globalData.shouldReloadFeed;
    if (shouldReload) {
      console.log("saved location", savedLocation);
      var options = {
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude
      }
      if (this.data.currentTag) {
        options['tag'] = this.data.currentTag;
      }
      console.log('Showinit:', options)
      refresh(self, options).then(res => {
        let allTags = calcTags(res, true);
        self.setData({
          allTags
        });
      });
      getApp().globalData.shouldReloadFeed = false;
    }

    // this.onTapTag()

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

  onLoad: function(options) {
    if (options) {
      var geo = {
        latitude: options.latitude,
        longitude: options.longitude,
        name: options.place
      }
      wx.setStorageSync('selectedLocation', geo);
      // this.data.currentTag = options.tag;
      this.setData({'currentTag': options.tag});
      getApp().globalData.shouldReloadFeed = true;
    }
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
  onTapPlace: function(e) {
    console.log(e.target.dataset);
    let geo = e.target.dataset.g;
    let loc = {
      latitude: geo[1],
      longitude: geo[0]
    }
    loc.name = e.target.dataset.p || '某地';
    console.log(geo);
    wx.setStorageSync('selectedLocation', loc);
    this.setData({
      selectedLocation: loc
    });
    refresh(this, loc);
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },
  onTapOpMore: function (e) {
    let post = e.target.dataset.p;
    let itemList = ['分享', '收藏', '评论']
    let user = wx.getStorageSync('userinfo')
    if (user._id == post.user_id) {
      itemList.push('删除')
    }
    wx.showActionSheet({
      itemList: itemList,
      success: res => {
        if (res.cancel) return;
        let action = itemList[res.tapIndex];
        if (action == '删除') {
          $request({
            url: `/post/${post._id}`,
            method: 'DELETE'
          })
        }
        if (action == '分享') {
          wx.navigateTo({
            url: `../post/post?id=${post._id}`,
            })
        }
        refresh(this);
      }
    })
  },
  onTapTag: function (e) {
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
    //e.stopPropagation();
    console.log("tap like", e);
    var userinfo = wx.getStorageSync("userinfo");
    var postId = e.currentTarget.dataset.id;
    var targetPhoto = this.data.photos.filter(photo => photo._id === postId)[0];
    const photos = this.data.photos.map(photo => {
      if (photo._id === postId) {
        console.log(photo)
        photo.isLikedByMe = true;
      }
      return photo;
    });
    this.setData({
      photos
    });
    console.log("tap on post", postId, targetPhoto, userinfo);
    request({
      url: "/got",
      method: "POST",
      data: {
        post_id: postId,
        user_id: userinfo._id
      },
      success: () => {
      }
    });
  },
  onTapUnLike: function(e) {
    console.log("tap like", e);
    var userinfo = wx.getStorageSync("userinfo");
    var postId = e.currentTarget.dataset.id;
    var targetPhoto = this.data.photos.filter(photo => photo._id === postId)[0];
    const photos = this.data.photos.map(photo => {
      if (photo._id === postId) {
        console.log(photo)
        photo.isLikedByMe = false;
      }
      return photo;
    });
    this.setData({
      photos
    });
    console.log("tap on post", postId, targetPhoto, userinfo);
    request({
      url: "/got",
      method: "DELETE",
      data: {
        post_id: postId,
        user_id: userinfo._id
      },
      success: () => {
      }
    });

  },
  onTapComment: function(e) {
    console.log(e, 'TAP comment')
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
        console.log(res)
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

  onShareAppMessage: function () { 
    var userinfo = wx.getStorageSync("userinfo");
    var location = wx.getStorageSync("location")
    var geo = this.data.selectedLocation.name && this.data.selectedLocation || location
    console.log(location, this.data.selectedLocation, geo)
    var path = `/pages/index/index?latitude=${geo.latitude}&longitude=${geo.longitude}&tag=${this.data.currentTag}&place=${geo.name && geo.name||''}`;
    var desc = `${userinfo.nickName} ${geo.name && '@' + geo.name || ''} ${this.data.currentTag || ''}`;
    console.log(path, desc)

    return {
      title: "泡影",
      desc: desc,
      path: path
    }
  },
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
