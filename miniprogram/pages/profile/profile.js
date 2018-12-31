// miniprogram/pages/profile/profile.js

const { request, $request } = require("../../lib/request");
const loginUtils = require("../../lib/handleLogin.js");

function refresh(self, options = {}) {

  var { userid, tag } = options
  var { latitude, longitude } = wx.getStorageSync("location");
  var data = {
    latitude,
    longitude,
  }
  if (tag) {
    data.tag = tag
  }
  wx.showLoading();
  $request({
    url: `/user/${userid}/feeds`,
    data,
  }).then(res => {
    console.log('fetch profile feed', res.data)
    let user = res.data[0].user
    const photos = res.data.map(photo => {
      let distant;
      if (photo.distant > 1000) {
        distant = (photo.distant / 1000).toFixed(1) + " km";
      } else {
        distant = photo.distant.toFixed(0) + " m";
      }
      return Object.assign(photo, {
        distant
      });
    });
    let tags = calcTags(res)
    let allTags = calcTags(res, true);
    // photos = array(photos.slice(0, 10));
    // console.log((photos));
    self.setData({
      photos,
      allPhotos: photos,
      user,
      tags,
      allTags
    })
    wx.hideLoading()
  }).catch(() => {
    wx.hideLoading()
  })


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

  /**
   * Page initial data
   */
  data: {
    photos: [],
    user: null,
    currentTag: '',
    tags: [],
    allTags: [],
    showExpand: true,
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    let userid = options.id
    console.log(userid)
    if (!userid) {
      var userinfo = wx.getStorageSync("userinfo");
      console.log('profile', userinfo._id)
      userid = userinfo._id
    }
    refresh(this, {
      userid
    })
    
  },

  onTapTag: function(e) {
    var tag = e.target.dataset.tag;
    console.log("tap on tag", tag, this.data.currentTag);

    

    if (this.data.currentTag === tag) {
      this.setData({
        currentTag: ""
      });
      // refresh(this);
    } else {
      const photos = this.data.allPhotos.filter(photo => {
        return photo.tags.indexOf(tag) > -1
      })
      console.log('filter photos', photos)
      this.setData({
        currentTag: tag,
        photos
      });
      // refresh(this, { tag });
    }
  },
  onTapHome: function (e) {

  },


  onTapExpandTag: function (e) {
    this.setData({
      tags: this.data.allTags,
      showExpand: false
    });
  },
  onOpenCamera: function () {
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
  },
  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function () {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function () {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function () {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function () {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function () {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function () {

  }
})