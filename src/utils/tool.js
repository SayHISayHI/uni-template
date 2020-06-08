export function toast (params) {
    if (typeof params == "string") {
        func ({ title: params })
    } else {
        func (params)
    }
    function func (options) {
        uni.showToast({
            title: options.title,
            duration: options.duration || 2000,
            icon: options.icon || 'none',
            image: options.image || '',
            mask: options.mask || false,
        });
    }
}

export const token = {
    key: 'token',
    get: () => {
        return uni.getStorageSync(this.key)
    },
    set: (token) => {
        uni.setStorageSync(this.key, token)
    },
    remove: () => {
        uni.removeStorageSync(this.key)
    }
}