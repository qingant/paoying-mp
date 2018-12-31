const request = options => {
  var userInfo = wx.getStorageSync("userinfo");
  options.url = "https://dejavu.duozhuayu.net/api-py/v1/" + options.url;
  options.headers = options.headers || {};
  options.headers["x-token"] = userInfo.token;
  wx.request(options);
};

const handleError = () => {
  wx.showToast({
    title: "网络错误，稍后再来。",
    icon: "none"
  });
};

const $request = options => {
  return new Promise((resolve, reject) => {
    options.success = function(res) {
      if (res.statusCode !== 200) {
        reject(res);
        handleError();
      } else {
        resolve(res);
      }
    };
    options.fail = function(res) {
      reject(res);
      handleError();
    };
    request(options);
  });
};
module.exports.request = request;
module.exports.$request = $request;
