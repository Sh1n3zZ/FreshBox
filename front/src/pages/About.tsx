export default function About() {
  return (
    <div className="container mx-auto max-w-7xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-4xl font-bold">关于我们</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          FreshBox 是一个先进的文档管理系统，专注于图像识别和内容分析。我们的使命是为您提供智能、高效的文档处理解决方案。
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">我们的愿景</h2>
          <p className="text-muted-foreground">
            我们致力于通过人工智能和机器学习技术，简化文档管理和处理流程。我们相信技术应该为人服务，而不是增加复杂性。FreshBox 旨在提供一个直观、高效的平台，让用户能够轻松地管理、分析和利用他们的文档数据。
          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">核心技术</h2>
          <p className="text-muted-foreground">
            我们的系统基于最先进的OCR（光学字符识别）技术和自然语言处理算法，能够准确地从各种格式的文档中提取关键信息。结合云计算和高效的数据存储技术，我们提供了一个安全、可靠且高性能的文档处理解决方案。
          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">我们的团队</h2>
          <p className="text-muted-foreground">
            FreshBox 团队由来自人工智能、软件工程和用户体验设计领域的专业人士组成。我们拥有丰富的经验和专业知识，致力于不断改进和创新我们的产品，以满足用户不断变化的需求。
          </p>
        </div>

        <div className="rounded-lg border p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">联系我们</h2>
          <p className="text-muted-foreground">
            我们重视与用户的沟通和反馈。如果您有任何问题、建议或需要支持，请随时通过以下方式联系我们:
          </p>
          <div className="mt-4">
            <p className="mb-2">
              <span className="font-semibold">邮箱：</span> support@freshbox.com
            </p>
            <p className="mb-2">
              <span className="font-semibold">电话：</span> +86 123 4567 8910
            </p>
            <p>
              <span className="font-semibold">地址：</span> 中国北京市朝阳区科技园区88号
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 