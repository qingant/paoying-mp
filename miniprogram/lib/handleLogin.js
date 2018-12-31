function login(callback) {
  wx.showLoading();
  wx.login({
    success(res) {
      if (res.code) {
        getUserInfo(res.code, callback);
      } else {
        showToast();
      }
    },
    fail() {
      showToast();
    }
  });
}

function getUserInfo(code, callback) {
  wx.getUserInfo({
    success(res) {
      // store.commit('storeUpdateWxUser', res.userInfo)

      console.log("login success", res.encryptedData, res.userInfo);
      postLogin(code, res.iv, res.encryptedData, res.userInfo, callback);
      wx.setStorageSync("wechat_userinfo", res.userInfo);
    },
    // 获取失败，弹窗提示一键登录
    fail() {
      wx.hideLoading();
      // 获取用户信息失败，清楚全局存储的登录状态，弹窗提示一键登录
      // 使用token管理登录态的，清楚存储全局的token
      // 使用cookie管理登录态的，可以清楚全局登录状态管理的变量
      // store.commit("storeUpdateToken", "");
      // 获取不到用户信息，说明用户没有授权或者取消授权。
      showLoginModal(function() {
        wx.navigateTo({
          url: "../login/login"
        });
        // wx.navigateBack({
        //   delta: 100
        // })
      });
    }
  });
}

// 开发者服务端登录
function postLogin(code, iv, encryptedData, userInfo, callback) {
  //   let params = {
  //     code: code,
  //     iv: iv,
  //     encryptedData: encryptedData
  //   };
  wx.hideLoading();
  wx.request({
    url: "https://dejavu.duozhuayu.net/api-py/v1/oauth",
    method: "POST",
    data: {
      code: code,
      nickName: userInfo.nickName,
      avatarUrl: userInfo.avatarUrl
    },
    success: function(res) {
      console.log("login success", res, callback);
      wx.setStorageSync("userinfo", res.data);
      if (callback) {
        callback();
      }
    }
  });
  // TODO
  //   request(apiUrl.postLogin, params, "post")
  //     .then(res => {
  //       if (res.code == 1) {
  //         wx.hideLoading();
  //         // 登录成功，
  //         // 使用token管理登录态的，存储全局token，用于当做登录态判断，
  //         // 使用cookie管理登录态的，可以存任意变量当做已登录状态
  //         store.commit("storeUpdateToken", res.data.token);
  //         callback && callback();
  //       } else {
  //         showToast();
  //       }
  //     })
  //     .catch(err => {
  //       showToast();
  //     });
}

// 显示toast弹窗
function showToast(content = "登录失败，请稍后再试") {
  wx.showToast({
    title: content,
    icon: "none"
  });
}

// 显示一键登录的弹窗
function showLoginModal(onConfirm) {
  wx.showModal({
    title: "提示",
    content: "你还未登录，登录后可获得完整体验 ",
    confirmText: "一键登录",
    success(res) {
      // 点击一键登录，去授权页面
      if (res.confirm) {
        console.log("onconfirm");
        onConfirm();
      }
    }
  });
}

module.exports.login = login;
