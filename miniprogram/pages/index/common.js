const app = getApp();

const loginUtils = require("../../lib/handleLogin.js");
const common = require("../../lib/common.js");
const { request, $request } = require("../../lib/request");

const upload = function (self) {
  // var self = this;
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

const refresh = function(self, options = {}) {
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
          distant,
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
}

const actions = {
  onTapPlace: function (e) {
    console.log(e.target.dataset);
    let geo = e.target.dataset.g;
    let loc = {
      latitude: geo[1],
      longitude: geo[0]
    }
    loc.name = e.target.dataset.p || '某地';
    console.log(geo);
    wx.setStorageSync('selectedLocation', loc);
    refresh(this, loc);

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
  onTapExpandTag: function (e) {
    this.setData({
      tags: this.data.allTags,
      showExpand: false
    });
  },
  onTapLike: function (e) {
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
  onTapUnLike: function (e) {
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
  onTapComment: function (e) {
    console.log(e, 'TAP comment')
    const pid = e.currentTarget.dataset.id;
    if (pid) {
      wx.navigateTo({
        url: `../post/post?id=${pid}`
      });
    }
  },
}

module.exports.refresh = refresh;
module.exports.calcTags = calcTags;
module.exports.actions = actions;