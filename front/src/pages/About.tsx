export default function About() {
  return (
    <div className="container mx-auto max-w-7xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-bold">关于我们</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          FreshBox 是一个创新解决市场痛点与食品浪费的临期食品盲盒社交化系统，我们致力于为用户提供一个便捷、高效且有趣的购物平台，让每个人都能轻松享受美味的临期食品，同时为可持续发展贡献一份力量。
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">我们的愿景</h2>
          <p className="text-muted-foreground">
            我们的目标是针对临期食品滞销的市场痛点，通过数字化技术将食品减损与社交价值创造有机结合，用数字科技赋能盲盒形式创意能够促进解决食品滞销问题，同时满足新生代消费者的社交互动需求，实现经济效益与社会价值的双重优化。
          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">技术创新</h2>
          <p className="text-muted-foreground">
            FreshBox采用全栈数字化解决方案，通过独创动态算法+盲盒营销+社交广场的销售方式，提供了解决临期食品滞销浪费的新方案，同时满足了新生代消费者的社交互动需求，开创了"消费+社交+公益"的新范式。

          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">我们的团队</h2>
          <p className="text-muted-foreground">
            FreshBox 团队由来自广东省珠海市的三位热爱人工智能创新的高中生组成。我致力于不断改进和创新我们的产品，以满足用户不断变化的需求，并为可持续发展做出贡献。我们相信，科技可以改变生活，我们希望通过 FreshBox 为可持续发展贡献自己的一份力量。
          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">联系我们</h2>
          <p className="text-muted-foreground">
            我们重视与用户的沟通和反馈。如果您有任何问题、建议或需要支持，请随时通过以下方式联系我们:
          </p>
          <div className="mt-4">
            <p className="mb-2">
              <span className="font-semibold">邮箱：</span> 2838821172@qq.com
            </p>
            <p className="mb-2">
              <span className="font-semibold">电话：</span> +86 133 9252 2245
            </p>
            <p>
              <span className="font-semibold">地址：</span> 广东省珠海市香洲区梅华西路2180号
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 