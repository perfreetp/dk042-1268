export type ServiceType = 'order' | 'payment' | 'user' | 'message' | 'database' | 'cache';

export interface Step {
  title: string;
  description: string;
}

export interface Command {
  name: string;
  cmd: string;
  description: string;
}

export interface Incident {
  date: string;
  title: string;
  impact: string;
  duration: string;
}

export interface Case {
  title: string;
  environment: string;
  description: string;
  solution: string;
}

export interface Article {
  id: string;
  title: string;
  service: ServiceType;
  errorCodes: string[];
  versions: string[];
  phenomenon: string;
  attention: string;
  tags: string[];
  viewCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  author: string;
  steps: Step[];
  commands: Command[];
  incidents: Incident[];
  cases: Case[];
}

export const mockArticles: Article[] = [
  {
    id: 'ART-001',
    title: '订单创建超时问题排查与处理方案',
    service: 'order',
    errorCodes: ['ORD-5001', 'ORD-5002', 'TIMEOUT-001'],
    versions: ['v2.1.0', 'v2.2.0', 'v2.3.0'],
    phenomenon: '用户提交订单后长时间无响应，前端显示创建超时，但实际订单可能已落库，造成重复下单或数据不一致。监控面板显示订单服务P99延迟超过5秒，错误率持续上升。',
    attention: '处理前务必确认订单是否已实际创建成功，禁止直接重试提交，防止重复扣费。优先查看分布式链路追踪日志定位具体瓶颈节点。',
    tags: ['订单', '超时', '性能', '高可用'],
    viewCount: 3421,
    ratingAvg: 4.8,
    ratingCount: 156,
    createdAt: '2025-09-15T10:30:00Z',
    updatedAt: '2026-01-20T14:22:00Z',
    author: '张伟',
    steps: [
      { title: '确认超时范围', description: '通过APM系统查看近30分钟订单创建接口的错误分布，确认是全量还是部分用户受影响，区分机房、服务实例维度。' },
      { title: '检查数据库状态', description: '登录数据库监控平台，查看订单库CPU、IOPS、连接数指标，确认是否存在慢查询或锁等待。' },
      { title: '分析消息队列积压', description: '检查订单创建后发送的Kafka消息是否有堆积，确认下游服务（库存、优惠券）消费能力是否充足。' },
      { title: '定位依赖服务瓶颈', description: '通过分布式追踪查看RPC调用链，分析用户服务、库存服务、营销服务的响应时间。' },
      { title: '执行应急方案', description: '若为数据库瓶颈，切换读写分离；若为下游服务不可用，触发熔断降级，返回"处理中"状态后异步补偿。' },
      { title: '验证修复效果', description: '观察错误率和延迟曲线是否恢复正常，抽取3-5笔异常订单做端到端验证。' }
    ],
    commands: [
      { name: '查看订单服务错误日志', cmd: 'kubectl logs -l app=order-service --since=30m | grep "ORD-5001" | head -50', description: '获取订单服务最近30分钟的错误日志样本' },
      { name: '统计超时请求分布', cmd: "grep 'order/create' /var/log/nginx/access.log | awk '{print $NF}' | sort | uniq -c | sort -rn", description: '统计Nginx访问日志中超时请求的分布情况' },
      { name: '检查数据库慢查询', cmd: "mysql -e \"SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 10 ORDER BY TIME DESC LIMIT 20;\"", description: '查看执行超过10秒的数据库查询' }
    ],
    incidents: [
      { date: '2025-11-11', title: '双十一订单创建大面积超时', impact: '约12万单创建延迟，用户投诉320起', duration: '47分钟' },
      { date: '2025-08-28', title: '数据库主从切换导致订单超时', impact: '华东区域约8%订单受影响', duration: '23分钟' }
    ],
    cases: [
      { title: '库存服务响应慢导致级联超时', environment: '生产-华东区', description: '大促期间库存服务缓存命中率下降，数据库压力增大，响应时间从50ms升至800ms，导致订单服务线程池耗尽。', solution: '紧急扩容库存服务实例10台，开启库存本地缓存，同时调整订单服务超时策略。' },
      { title: 'Kafka Broker磁盘IO瓶颈', environment: '预发环境', description: 'Kafka Broker节点磁盘使用率达95%，消息写入延迟激增，订单创建后状态更新不及时。', solution: '清理过期日志，扩容Broker存储，调整消息保留策略。' }
    ]
  },
  {
    id: 'ART-002',
    title: '订单状态异常不一致问题处理指引',
    service: 'order',
    errorCodes: ['ORD-6001', 'ORD-6002', 'ORD-6003'],
    versions: ['v2.0.0', 'v2.1.0', 'v2.2.0', 'v2.3.0'],
    phenomenon: '订单在前端显示"待支付"但实际已支付成功，或显示"已发货"但物流系统无记录。订单状态机流转异常，中间状态停留时间过长或跳过某些状态。',
    attention: '涉及资金和用户体验的敏感问题，操作前必须有双人复核。修改订单状态前务必保留操作日志，便于事后审计。',
    tags: ['订单', '状态一致性', '数据修复', '对账'],
    viewCount: 2187,
    ratingAvg: 4.6,
    ratingCount: 98,
    createdAt: '2025-07-22T09:15:00Z',
    updatedAt: '2025-12-10T16:45:00Z',
    author: '李娜',
    steps: [
      { title: '采集异常订单信息', description: '收集用户提供的订单号、支付凭证、截图，通过订单管理后台查询订单当前状态和流转历史。' },
      { title: '多数据源交叉比对', description: '比对订单库、支付流水、物流系统、MQ消息记录，确定真实的业务状态和数据库状态差异点。' },
      { title: '定位根因', description: '分析状态机流转代码、事务边界、消息消费日志，判断是代码缺陷、消息丢失还是并发问题。' },
      { title: '评估影响范围', description: '通过时间窗口、错误码等条件扫描全量订单，统计受影响的订单数量和金额。' },
      { title: '制定修复方案', description: '根据异常类型选择补偿任务、手动修复脚本或数据订正SQL，编写修复方案并经评审。' }
    ],
    commands: [
      { name: '查询订单状态流转历史', cmd: "mysql -e \"SELECT order_id, status, operator, create_time FROM order_status_log WHERE order_id = '123456' ORDER BY create_time;\"", description: '查询指定订单的状态变更历史' },
      { name: '批量扫描异常订单', cmd: "mysql -e \"SELECT o.order_id, o.status, p.status FROM orders o LEFT JOIN payment p ON o.order_id = p.order_id WHERE o.status = 1 AND p.status = 2 AND o.create_time > '2026-01-01';\"", description: '查找已支付但订单状态仍为待支付的异常数据' }
    ],
    incidents: [
      { date: '2025-10-15', title: '支付回调消息丢失导致订单状态不一致', impact: '约5400笔订单状态异常，涉及金额380万', duration: '2小时15分' }
    ],
    cases: [
      { title: '并发更新导致状态回退', environment: '生产-华北区', description: '同一订单同时触发支付回调和超时取消，因缺少乐观锁导致已支付状态被回退为已取消。', solution: '增加订单状态机的乐观锁版本号控制，禁止逆向状态流转。' }
    ]
  },
  {
    id: 'ART-003',
    title: '支付回调失败处理与补偿机制',
    service: 'payment',
    errorCodes: ['PAY-7001', 'PAY-7002', 'PAY-7003'],
    versions: ['v3.0.0', 'v3.1.0', 'v3.2.0'],
    phenomenon: '第三方支付已扣款成功，但商户系统未收到回调或回调处理失败，导致订单状态未更新为"已支付"。支付对账系统出现差异记录。',
    attention: '支付问题涉及资金安全，严禁直接修改支付流水。所有操作必须留痕，修复前需与第三方支付平台确认交易状态。',
    tags: ['支付', '回调', '三方对接', '资金安全'],
    viewCount: 4562,
    ratingAvg: 4.9,
    ratingCount: 234,
    createdAt: '2025-06-10T11:00:00Z',
    updatedAt: '2026-02-05T08:30:00Z',
    author: '王磊',
    steps: [
      { title: '确认支付状态', description: '登录第三方支付商户后台，通过商户订单号查询交易状态，确认用户是否已真实扣款。' },
      { title: '排查回调链路', description: '检查Nginx访问日志确认回调请求是否到达，查看支付服务日志确认回调处理是否抛异常。' },
      { title: '验证签名和参数', description: '对比回调请求的签名计算结果，检查参数是否完整，时间戳是否在有效期内。' },
      { title: '执行手工回调', description: '使用支付平台提供的补单接口或管理后台触发回调重推，或调用内部补偿接口。' },
      { title: '对账与平账', description: '待回调成功后，检查订单状态、账务流水是否一致，确保资金科目平衡。' }
    ],
    commands: [
      { name: '查看回调请求日志', cmd: "grep 'notify/alipay' /var/log/nginx/access.log | awk '{print $1, $4, $7, $9}' | tail -100", description: '查看支付宝回调接口的请求记录和HTTP状态码' },
      { name: '查询待补偿支付记录', cmd: "mysql -e \"SELECT trade_no, order_id, amount, create_time FROM payment_notify WHERE status = 0 AND retry_count < 5 AND create_time > DATE_SUB(NOW(), INTERVAL 24 HOUR);\"", description: '查询24小时内需要补偿的支付回调记录' },
      { name: '触发单笔回调补偿', cmd: 'curl -X POST http://payment-service/internal/notify/retry -H "Content-Type: application/json" -d \'{"tradeNo":"2026010112345678"}\'', description: '调用内部接口触发单笔支付回调重试' },
      { name: '导出差异对账数据', cmd: "mysql -e \"SELECT * FROM payment_reconcile WHERE diff_type != 0 AND date = CURDATE() - 1 INTO OUTFILE '/tmp/diff.csv' FIELDS TERMINATED BY ',';\"", description: '导出前一日对账差异数据' }
    ],
    incidents: [
      { date: '2025-09-20', title: '微信支付证书过期导致回调验签失败', impact: '约8600笔支付回调失败，用户投诉激增', duration: '1小时40分' },
      { date: '2025-05-12', title: '机房网络抖动造成回调大面积丢失', impact: '约3200笔交易受影响', duration: '35分钟' }
    ],
    cases: [
      { title: '支付宝V3接口升级后回调格式变更', environment: '全量生产', description: '支付宝升级openAPI V3后回调报文结构调整，原有解析代码字段映射错误，导致验签失败。', solution: '紧急回滚到V2接口，同时适配V3报文结构，灰度切换。' },
      { title: '回调URL被WAF误拦截', environment: '生产-华南区', description: 'WAF策略误将回调请求中的敏感参数识别为SQL注入，返回403。', solution: '将支付平台IP段加入WAF白名单，调整规则敏感度。' }
    ]
  },
  {
    id: 'ART-004',
    title: '重复支付问题识别与退款处理',
    service: 'payment',
    errorCodes: ['PAY-8001', 'PAY-8002', 'PAY-8003'],
    versions: ['v2.5.0', 'v3.0.0', 'v3.1.0', 'v3.2.0'],
    phenomenon: '同一订单用户被多次扣款，支付流水出现2条以上成功记录。用户收到多条支付短信通知，银行账单显示多笔消费。',
    attention: '重复支付属于严重资金事故，第一时间安抚用户，优先处理退款。退款前需财务审核，禁止私自操作。',
    tags: ['支付', '重复扣款', '退款', '风控'],
    viewCount: 3891,
    ratingAvg: 4.7,
    ratingCount: 187,
    createdAt: '2025-04-18T14:20:00Z',
    updatedAt: '2026-01-15T10:10:00Z',
    author: '赵敏',
    steps: [
      { title: '核实重复支付事实', description: '收集订单号、用户手机号，在支付后台查询该订单的所有支付流水，确认支付渠道、金额、时间。' },
      { title: '判断重复原因', description: '分析支付请求日志，区分是用户重复点击、前端BUG、接口重试还是第三方支付异步通知问题。' },
      { title: '锁定多余资金', description: '若资金尚未结算，联系支付平台挂起多余款项，避免进入结算流程增加退款成本。' },
      { title: '发起退款流程', description: '填写退款申请单，附重复支付证据，经财务审批后调用退款接口原路退回。' },
      { title: '用户沟通与补偿', description: '退款完成后通知用户，根据影响程度可考虑给予优惠券等补偿。' },
      { title: '完善防重机制', description: '检查幂等性设计，补齐前端防重点击、服务端幂等令牌、数据库唯一索引等。' }
    ],
    commands: [
      { name: '查询订单支付流水', cmd: "mysql -e \"SELECT id, trade_no, channel, amount, status, create_time FROM payment WHERE order_id = '987654321' ORDER BY create_time;\"", description: '查询指定订单的所有支付记录' },
      { name: '按用户统计重复支付', cmd: "mysql -e \"SELECT user_id, order_id, COUNT(*) AS cnt FROM payment WHERE status = 1 AND create_time > DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY user_id, order_id HAVING cnt > 1;\"", description: '统计近7天内存在重复支付的用户和订单' },
      { name: '调用退款接口', cmd: 'curl -X POST http://payment-service/internal/refund -H "Content-Type: application/json" -d \'{"paymentId":"12345","reason":"重复支付","operator":"admin"}\'', description: '调用内部退款接口处理重复支付' }
    ],
    incidents: [
      { date: '2025-12-25', title: '圣诞活动页面前端防抖失效导致重复支付', impact: '约1280笔重复支付，涉及金额92万', duration: '1小时10分' }
    ],
    cases: [
      { title: '网络重试导致服务端重复扣款', environment: '预发环境', description: '客户端请求超时后Feign自动重试，但服务端未做幂等校验，导致同一请求被执行两次。', solution: '所有支付写操作增加幂等Token校验，数据库加唯一索引( order_id, channel, status )。' }
    ]
  },
  {
    id: 'ART-005',
    title: '用户登录失败常见原因排查手册',
    service: 'user',
    errorCodes: ['USR-1001', 'USR-1002', 'USR-1003', 'USR-1004'],
    versions: ['v4.0.0', 'v4.1.0', 'v4.2.0'],
    phenomenon: '用户无法正常登录，表现为验证码收不到、密码错误提示、滑块验证不通过、登录后立即退出等。客服工单中登录相关投诉占比突增。',
    attention: '排查时注意保护用户隐私，禁止在日志中明文打印密码、验证码等敏感信息。处理完后及时清除临时调试信息。',
    tags: ['用户', '登录', '认证', '账号安全'],
    viewCount: 2756,
    ratingAvg: 4.5,
    ratingCount: 112,
    createdAt: '2025-08-01T13:40:00Z',
    updatedAt: '2025-12-28T09:55:00Z',
    author: '陈强',
    steps: [
      { title: '确认问题范围', description: '查看监控大盘，判断是全量登录异常还是特定渠道（APP/小程序/H5）、特定运营商、特定地区用户。' },
      { title: '区分故障类型', description: '根据错误码判断是账号密码错误、验证码发送失败、第三方登录授权失败、风控拦截还是Session问题。' },
      { title: '检查依赖服务', description: '依次检查短信网关、滑块验证服务、Redis会话存储、用户数据库、OAuth授权服务的健康状态。' },
      { title: '抓取现场日志', description: '获取用户DeviceId/IP，在日志平台检索对应的登录请求链路，定位具体报错堆栈。' },
      { title: '验证并修复', description: '根据定位结果执行相应修复措施，如重启服务、切换短信通道、调整风控阈值等。' }
    ],
    commands: [
      { name: '按错误码统计登录失败', cmd: "grep 'login' /var/log/app/user-service.log | grep -oP 'code=\\d+' | sort | uniq -c | sort -rn", description: '统计登录接口各错误码的出现次数' },
      { name: '查询短信发送状态', cmd: "mysql -e \"SELECT mobile, code, status, fail_reason, create_time FROM sms_verify WHERE mobile = '138****8888' ORDER BY create_time DESC LIMIT 20;\"", description: '查询指定手机号的验证码发送历史' },
      { name: '检查Redis连接状态', cmd: 'redis-cli -h user-redis.example.com -p 6379 info clients | grep connected_clients', description: '检查用户Redis的客户端连接数' }
    ],
    incidents: [
      { date: '2025-11-05', title: '短信运营商通道故障导致验证码发送失败', impact: '移动用户登录成功率下降至62%', duration: '1小时25分' },
      { date: '2025-07-18', title: '滑块验证第三方服务域名解析异常', impact: 'Web端登录完全不可用', duration: '52分钟' }
    ],
    cases: [
      { title: 'HTTPS证书链不完整导致iOS登录失败', environment: '生产-iOS端', description: '服务器缺少中间证书，iOS 15以上系统ATS校验失败，所有HTTPS请求被拦截。', solution: '重新部署包含完整证书链的PEM文件。' },
      { title: 'Redis大Key导致会话读取超时', environment: '生产-全量', description: '用户权限信息缓存为单个Hash结构，数据量过大，加载耗时超过超时阈值。', solution: '拆分大Key为多个细粒度缓存，设置合理过期时间。' }
    ]
  },
  {
    id: 'ART-006',
    title: 'Token过期与续签异常处理方案',
    service: 'user',
    errorCodes: ['USR-2001', 'USR-2002', 'USR-2003'],
    versions: ['v3.5.0', 'v4.0.0', 'v4.1.0', 'v4.2.0'],
    phenomenon: '用户在正常使用过程中频繁被踢出到登录页，日志显示大量401未授权错误。续签接口调用失败，Refresh Token无法换取新的Access Token。',
    attention: 'Token续签涉及安全机制，修复时注意不能降低安全性要求，如缩短过期时间、禁用HttpOnly等措施必须经安全评审。',
    tags: ['Token', 'JWT', '会话', '续签', '401'],
    viewCount: 1987,
    ratingAvg: 4.4,
    ratingCount: 76,
    createdAt: '2025-05-28T16:00:00Z',
    updatedAt: '2025-11-30T11:20:00Z',
    author: '刘洋',
    steps: [
      { title: '确认Token类型和有效期', description: '抓取用户请求的Authorization头，解析JWT的exp字段，确认Access Token和Refresh Token的实际有效期。' },
      { title: '检查时钟同步', description: '验证JWT签发服务、网关、各业务服务器的系统时间是否一致，NTP服务是否正常。' },
      { title: '排查续签接口', description: '查看续签接口日志，检查Refresh Token是否已被吊销、是否存在并发续签互斥问题。' },
      { title: '分析Cookie设置', description: '检查Cookie的Domain、Path、Secure、SameSite属性是否正确，跨域场景下是否配置了withCredentials。' },
      { title: '验证密钥一致性', description: '确认所有JWT验证节点使用的公钥/密钥是否一致，密钥轮换是否按规范执行。' }
    ],
    commands: [
      { name: '解析JWT Token内容', cmd: "echo 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' | base64 -d | jq 2>/dev/null || python3 -c \"import base64,json; t='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'.split('.'); print(json.dumps(json.loads(base64.b64decode(t[1]+'==')),indent=2))\"", description: '解码JWT Payload查看过期时间等信息' },
      { name: '统计401错误趋势', cmd: "grep 'HTTP/1.1 401' /var/log/nginx/access.log | awk '{print substr($4,2,14)}' | uniq -c", description: '按小时统计401错误的发生趋势' },
      { name: '查询Token吊销记录', cmd: "redis-cli -h auth-redis.example.com keys 'revoke:*' | wc -l", description: '统计Redis中被吊销的Refresh Token数量' }
    ],
    incidents: [
      { date: '2025-10-08', title: 'JWT密钥配置不一致导致Token验证失败', impact: '约15%在线用户被强制下线', duration: '40分钟' }
    ],
    cases: [
      { title: '浏览器SameSite策略变化导致Cookie丢失', environment: '生产-Chrome端', description: 'Chrome 84+默认SameSite=Lax，跨站POST请求中Cookie未携带，续签接口拿不到Refresh Token。', solution: '显式设置SameSite=None; Secure，并确保HTTPS访问。' },
      { title: '并发续签导致Token失效', environment: '压测环境', description: '同一用户同时发起多个续签请求，第一个成功后Refresh Token被注销，后续请求全部失败。', solution: '续签接口增加分布式锁，采用滑动窗口续签策略。' }
    ]
  },
  {
    id: 'ART-007',
    title: '消息推送延迟问题定位与优化',
    service: 'message',
    errorCodes: ['MSG-3001', 'MSG-3002', 'MSG-3003'],
    versions: ['v1.8.0', 'v1.9.0', 'v2.0.0'],
    phenomenon: 'APP通知推送延迟超过5分钟到达，或批量推送任务堆积。运营反馈营销活动触达率下降，用户投诉收不到订单状态变更通知。',
    attention: '批量推送补偿时注意控制发送速率，避免触发第三方推送平台限流，防止对用户造成消息轰炸。',
    tags: ['消息', '推送', '延迟', '极光', 'Firebase'],
    viewCount: 1654,
    ratingAvg: 4.3,
    ratingCount: 67,
    createdAt: '2025-03-12T08:45:00Z',
    updatedAt: '2025-09-25T15:30:00Z',
    author: '孙浩',
    steps: [
      { title: '确认延迟范围', description: '通过消息ID查询推送链路各节点时间戳，区分是产生延迟、MQ积压、推送服务处理慢还是第三方平台延迟。' },
      { title: '检查消息队列', description: '查看Kafka/RabbitMQ消费组Lag值，确认消费速率，分析是否有消费异常或阻塞。' },
      { title: '检查第三方推送平台', description: '登录极光/个推/Firebase控制台，查看平台推送速度、限流状态、回执送达率。' },
      { title: '分析消息内容', description: '检查推送消息的大小、是否携带大图等冗余数据，是否存在序列化性能问题。' },
      { title: '执行应急分流', description: '若单一通道拥堵，启用备用推送通道；若积压严重，可临时跳过非核心通知。' },
      { title: '补偿发送', description: '统计丢失或超时的消息，用离线脚本重新推送，注意去重。' }
    ],
    commands: [
      { name: '查看Kafka消费积压', cmd: 'kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group push-consumer-group', description: '查看推送消费组的Lag情况' },
      { name: '统计推送延迟分布', cmd: "mysql -e \"SELECT TIMESTAMPDIFF(SECOND, create_time, arrive_time) AS diff, COUNT(*) FROM push_record WHERE create_time > DATE_SUB(NOW(), INTERVAL 1 HOUR) GROUP BY diff DIV 60;\"", description: '统计近1小时推送延迟的分钟级分布' },
      { name: '检查推送服务线程状态', cmd: 'jstack $(jps | grep PushApplication | awk \'{print $1}\') | grep -A 20 "BLOCKED" | head -80', description: '打印Java线程栈查看是否有阻塞' }
    ],
    incidents: [
      { date: '2025-06-18', title: '618大促推送量激增导致MQ积压', impact: '300万条通知延迟平均12分钟', duration: '3小时' },
      { date: '2025-02-14', title: '第三方推送平台限流', impact: '约20万条情人节活动推送延迟', duration: '1小时50分' }
    ],
    cases: [
      { title: '推送线程池被长任务阻塞', environment: '生产-华东区', description: '部分推送请求附带图片裁剪逻辑，IO密集型任务占满线程池，普通文本推送无法被调度。', solution: '拆分线程池，图片裁剪移至异步任务，核心推送独享线程池。' },
      { title: '单条消息过大触发Kafka分片不均', environment: '预发环境', description: '个别营销消息携带长文本和Base64图片达2MB，导致某几个Broker磁盘IO打满，该分片消费停滞。', solution: '限制单条消息大小不超过64KB，大内容改为对象存储+短链方式。' }
    ]
  },
  {
    id: 'ART-008',
    title: '短信发送失败原因分析与处理',
    service: 'message',
    errorCodes: ['MSG-4001', 'MSG-4002', 'MSG-4003', 'MSG-4004'],
    versions: ['v1.5.0', 'v1.6.0', 'v1.7.0', 'v1.8.0', 'v1.9.0', 'v2.0.0'],
    phenomenon: '用户收不到短信验证码或通知短信，短信后台失败率飙升，运营商回执返回错误码，用户投诉收不到验证码无法登录。',
    attention: '短信涉及通信运营商，故障恢复可能依赖外部响应时间。注意短信失败补偿不能无限重试，避免用户被骚扰。',
    tags: ['短信', '验证码', '运营商', '通道切换'],
    viewCount: 3124,
    ratingAvg: 4.6,
    ratingCount: 143,
    createdAt: '2025-02-20T10:15:00Z',
    updatedAt: '2026-02-10T13:40:00Z',
    author: '周芳',
    steps: [
      { title: '确认失败类型', description: '查看短信发送记录的错误码，区分是提交失败（平台拒收）还是回执失败（运营商投递失败）。' },
      { title: '检查账户与签名', description: '登录运营商/短信平台控制台，检查账户余额、短信签名、模板审核状态，确认是否被封禁。' },
      { title: '检查发送频率', description: '统计近期短信发送量，确认是否触发平台限流或反垃圾策略，是否被标记为营销短信。' },
      { title: '通道切换', description: '若主通道故障，立即切换至备用通道，调整流量权重，必要时启动第三个通道。' },
      { title: '重发补偿', description: '筛选状态为"未知"或"临时失败"的记录执行重发，对已明确失败的分析原因后再处理。' },
      { title: '用户告知', description: '若影响较大，通过APP弹窗、站内信等方式告知用户当前短信延迟，建议稍后重试。' }
    ],
    commands: [
      { name: '按失败原因统计', cmd: "mysql -e \"SELECT fail_code, fail_reason, COUNT(*) FROM sms_record WHERE status = 2 AND create_time > DATE_SUB(NOW(), INTERVAL 2 HOUR) GROUP BY fail_code, fail_reason;\"", description: '统计近2小时短信失败的原因分布' },
      { name: '测试主备通道连通性', cmd: "curl -X POST 'https://sms.example.com/send' -d 'account=xxx&password=xxx&mobile=13800138000&content=test' && echo '---主通道---'; curl -X POST 'https://sms-backup.example.com/send' -d 'account=xxx&password=xxx&mobile=13800138000&content=test'", description: '分别测试主备短信通道的发送接口' },
      { name: '查询通道配额余量', cmd: "curl -s 'https://sms.example.com/quota?account=xxx' | jq .", description: '查询主短信通道的剩余发送配额' },
      { name: '批量重发失败短信', cmd: 'python3 /scripts/resend_sms.py --from-time "2026-02-10 10:00:00" --to-time "2026-02-10 12:00:00" --status failed', description: '调用重发脚本处理指定时间段的失败短信' }
    ],
    incidents: [
      { date: '2026-01-08', title: '阿里云短信签名被误封导致验证码发送全量失败', impact: '全平台注册、登录、找回密码功能不可用', duration: '2小时30分' },
      { date: '2025-09-03', title: '移动运营商拦截营销短信', impact: '活动通知短信送达率降至38%', duration: '5小时' }
    ],
    cases: [
      { title: '短信内容触发敏感词过滤', environment: '生产-全量', description: '活动短信中包含"现金""红包"等词汇，被运营商反垃圾系统拦截，提交即失败。', solution: '修改文案，拆分敏感词，提前将模板报备运营商审核。' },
      { title: '单IP发送量过高被限流', environment: '生产-出口IP', description: '大促期间从固定出口IP发起的短信请求量过大，被平台风控识别为异常流量。', solution: '配置多出口IP轮询，提前与短信平台报备大促发送量。' }
    ]
  },
  {
    id: 'ART-009',
    title: '数据库连接池耗尽应急处置手册',
    service: 'database',
    errorCodes: ['DB-5001', 'DB-5002', 'DB-5003'],
    versions: ['MySQL-8.0', 'MySQL-5.7', 'PostgreSQL-14', 'PostgreSQL-15'],
    phenomenon: '应用日志大量出现"Could not get JDBC connection"，数据库端max_connections达到上限，新连接被拒绝。所有依赖该库的业务接口响应缓慢或超时。',
    attention: 'Kill连接时务必先确认连接对应的业务，禁止直接Kill数据库核心系统线程。调整连接池参数属于重大变更，需要评估应用端容量。',
    tags: ['数据库', '连接池', 'HikariCP', '性能', '应急'],
    viewCount: 5342,
    ratingAvg: 4.9,
    ratingCount: 289,
    createdAt: '2025-01-05T09:00:00Z',
    updatedAt: '2026-02-12T17:15:00Z',
    author: '吴斌',
    steps: [
      { title: '确认连接耗尽', description: '登录数据库执行show processlist，查看连接数、状态分布、执行时间最长的查询。' },
      { title: '识别异常连接', description: '区分是正常业务峰值还是异常连接，关注Sleep状态过长的连接、长时间执行的SQL、来自异常IP的连接。' },
      { title: '紧急释放连接', description: '优先Kill掉Sleep超过5分钟的空闲连接，其次Kill掉执行时间最长且非核心的查询。必要时重启部分无状态应用释放连接。' },
      { title: '临时扩容', description: '调大数据库max_connections参数（注意max上限），同时调大关键应用的连接池，将非核心应用切换到只读库。' },
      { title: '根因分析', description: '分析连接泄漏代码（取连接未归还）、慢查询持有连接过久、连接池配置不合理、突发流量等。' },
      { title: '长效优化', description: '引入读写分离、分库分表、优化慢查询、连接池监控告警、接入数据库代理层。' }
    ],
    commands: [
      { name: '查看当前连接概览', cmd: "mysql -e \"SHOW STATUS LIKE 'Threads%'; SHOW VARIABLES LIKE 'max_connections';\"", description: '查看当前线程数和最大连接数配置' },
      { name: '查询各来源IP连接数', cmd: "mysql -e \"SELECT SUBSTRING_INDEX(host, ':', 1) AS ip, COUNT(*) AS cnt FROM information_schema.PROCESSLIST GROUP BY ip ORDER BY cnt DESC LIMIT 20;\"", description: '统计连接来源IP的连接数分布' },
      { name: '批量Kill空闲连接', cmd: "mysql -e \"SELECT CONCAT('KILL ', id, ';') FROM information_schema.PROCESSLIST WHERE COMMAND = 'Sleep' AND TIME > 300;\" | grep '^KILL' > /tmp/kill_sleep.sql && mysql < /tmp/kill_sleep.sql", description: '批量Kill掉Sleep超过5分钟的连接' },
      { name: '查看各应用HikariCP状态', cmd: "curl -s http://app-service/actuator/metrics/hikaricp.connections.active?tag=pool:primary | jq .measurements[0].value", description: '通过Spring Actuator查看HikariCP活跃连接数' }
    ],
    incidents: [
      { date: '2025-12-31', title: '跨年活动慢查询堆积导致连接池耗尽', impact: '核心交易链路中断约50分钟', duration: '50分钟' },
      { date: '2025-08-15', title: '订单服务连接泄漏', impact: '订单、支付、用户中心等多个服务受影响', duration: '1小时15分' }
    ],
    cases: [
      { title: 'HikariCP连接泄漏检测阈值过大', environment: '生产-订单库', description: '代码中某些异常分支未关闭Connection，而HikariCP的leakDetectionThreshold设置为0未启用检测，连接持续泄漏。', solution: '设置leakDetectionThreshold=2000启用泄漏检测，修复未关闭连接的代码，升级到try-with-resources模式。' },
      { title: 'MyBatis一级缓存持有长连接', environment: '压测环境', description: '大事务中嵌套多次查询，MyBatis一级缓存复用同一个连接，事务未提交前连接不释放，导致连接被长时间占用。', solution: '拆分大事务，关键查询走从库，配置SqlSessionFactory关闭不必要的缓存。' }
    ]
  },
  {
    id: 'ART-010',
    title: '慢查询堆积识别与优化指南',
    service: 'database',
    errorCodes: ['DB-6001', 'DB-6002', 'DB-6003'],
    versions: ['MySQL-5.7', 'MySQL-8.0'],
    phenomenon: '数据库CPU持续高负荷，IOWAIT飙升，业务接口普遍响应缓慢。慢查询日志短时间内产生大量记录，show processlist中大量查询处于Sending data或Copying to tmp table状态。',
    attention: '在线上执行DDL或添加索引时务必使用pt-online-schema-change或gh-ost，避免锁表。索引优化需在从库验证执行计划后再主库执行。',
    tags: ['数据库', '慢查询', '索引', 'SQL优化', '性能'],
    viewCount: 6128,
    ratingAvg: 4.8,
    ratingCount: 312,
    createdAt: '2024-12-10T10:30:00Z',
    updatedAt: '2026-02-08T14:00:00Z',
    author: '郑凯',
    steps: [
      { title: '定位Top慢查询', description: '开启慢查询日志，设置long_query_time=1，使用pt-query-digest分析慢日志，按执行次数、总耗时、锁等待时间排序。' },
      { title: '分析执行计划', description: '对高频慢查询执行EXPLAIN，关注type（是否走索引）、rows（扫描行数）、Extra（是否有Using filesort/temporary）。' },
      { title: '优化索引', description: '根据查询条件和排序字段设计联合索引，遵循最左前缀原则，消除回表，去除冗余索引。' },
      { title: '优化SQL写法', description: '避免SELECT *，拆分大IN子句，用JOIN替代子查询，避免在索引列上使用函数运算，深分页优化。' },
      { title: '数据归档与分库分表', description: '对超过千万级的大表进行冷热数据分离，采用分区表或ShardingSphere水平拆分。' },
      { title: '持续治理', description: '上线SQL审核平台，新SQL必须DBA评审，慢查询告警接入OnCall，定期跑全表索引分析。' }
    ],
    commands: [
      { name: '开启并分析慢查询日志', cmd: "mysql -e \"SET GLOBAL slow_query_log=1; SET GLOBAL long_query_time=1;\" && sleep 60 && pt-query-digest /var/lib/mysql/slow.log --limit 20", description: '开启慢日志并采集1分钟后用pt工具分析Top20' },
      { name: '查看当前执行中的慢SQL', cmd: "mysql -e \"SELECT id, user, host, db, COMMAND, TIME, STATE, LEFT(info, 200) AS query FROM information_schema.PROCESSLIST WHERE TIME > 3 AND COMMAND != 'Sleep' ORDER BY TIME DESC;\"", description: '查看执行超过3秒的活跃查询' },
      { name: '查看表索引使用情况', cmd: "mysql -e \"SELECT OBJECT_NAME, INDEX_NAME, COUNT_FETCH, COUNT_INSERT, COUNT_UPDATE FROM sys.schema_unused_indexes WHERE object_schema = DATABASE();\"", description: '查询未被使用的冗余索引' },
      { name: '统计各表扫描行数', description: '找出全表扫描频繁的表', cmd: "mysql -e \"SELECT table_name, rows_fetched, rows_inserted, rows_updated FROM sys.schema_table_statistics ORDER BY rows_fetched DESC LIMIT 10;\"" }
    ],
    incidents: [
      { date: '2025-07-22', title: '订单查询接口全表扫描导致数据库CPU 100%', impact: '订单相关页面全部超时', duration: '1小时40分' },
      { date: '2025-04-09', title: '营销活动页SQL缺少索引引发雪崩', impact: '首页打开耗时从200ms升至6s', duration: '35分钟' }
    ],
    cases: [
      { title: '深分页查询性能问题', environment: '生产-商品库', description: '商品列表页页码到100+时，LIMIT 100000,20扫描行数巨大，响应时间超过3秒。', solution: '改为游标分页（基于上次最大ID），或先覆盖索引查ID再回表JOIN。' },
      { title: 'OR条件导致索引失效', environment: '预发环境', description: 'WHERE条件中使用了 a=1 OR b=2，虽然a和b分别有索引，但MySQL无法组合使用，走了全表扫描。', solution: '拆分为两个查询用UNION ALL合并，或添加(a,b)联合索引，视业务而定。' }
    ]
  },
  {
    id: 'ART-011',
    title: 'Redis缓存击穿问题分析与解决方案',
    service: 'cache',
    errorCodes: ['CACHE-9001', 'CACHE-9002'],
    versions: ['Redis-6.2', 'Redis-7.0', 'Redis-7.2'],
    phenomenon: '热点Key失效瞬间，大量请求直接穿透到数据库，数据库QPS瞬时飙高数倍甚至被打挂。Redis监控显示缓存命中率骤降，数据库CPU和连接数告警。',
    attention: '设置热点Key永不过期时务必配套主动更新机制，防止数据不一致。互斥锁方案要注意死锁和超时问题，锁粒度不能太大。',
    tags: ['缓存', 'Redis', '击穿', '热点Key', '高并发'],
    viewCount: 4210,
    ratingAvg: 4.7,
    ratingCount: 201,
    createdAt: '2025-03-01T11:30:00Z',
    updatedAt: '2026-01-25T16:50:00Z',
    author: '黄磊',
    steps: [
      { title: '识别热点Key', description: '通过Redis MONITOR、hotkeys参数、或客户端埋点统计访问频次最高的Key列表。' },
      { title: '确认失效模式', description: '查看这些热点Key的TTL设置，是否集中在同一时间过期，过期时间是否过短。' },
      { title: '紧急处理', description: '立即通过脚本重建热点Key的缓存，必要时临时将问题接口熔断或返回降级数据，保护数据库。' },
      { title: '设置永不过期', description: '对Top热点Key设置逻辑过期（缓存对象内包含过期时间字段），后台异步线程主动刷新，物理上不设置TTL。' },
      { title: '加互斥锁', description: '缓存重建时加分布式锁（SETNX+过期），保证只有一个请求去查库构建缓存，其他请求等待或降级。' },
      { title: '打散过期时间', description: '对非极端热点Key的TTL增加随机偏移，如基础1小时+0~300秒随机，防止批量失效。' }
    ],
    commands: [
      { name: '扫描Redis热点Key', cmd: 'redis-cli --hotkeys -h redis.example.com -p 6379 2>/dev/null | head -30', description: '使用Redis自带hotkeys命令查找热点键（需开启LFU模式）' },
      { name: '查看大Key/热Key详细信息', cmd: "redis-cli -h redis.example.com MEMORY USAGE 'hot:product:12345'", description: '查看指定Key的内存占用' },
      { name: '批量延长热点Key过期时间', cmd: "redis-cli -h redis.example.com --scan --pattern 'hot:*' | xargs -I {} redis-cli -h redis.example.com EXPIRE {} 3600", description: '批量将hot:前缀的Key过期时间设为1小时' },
      { name: '监控数据库QPS变化', cmd: "mysql -e \"SHOW STATUS LIKE 'Questions';\" && sleep 10 && mysql -e \"SHOW STATUS LIKE 'Questions';\" | awk 'NR==2{print \"QPS:\", ($2-prev)/10}' prev=$(mysql -e \"SHOW STATUS LIKE 'Questions';\" | awk 'NR==2{print $2}')", description: '查看数据库每秒查询数' }
    ],
    incidents: [
      { date: '2025-11-11', title: 'Top100商品缓存集中过期导致商品库被打挂', impact: '商品详情页503错误率达35%', duration: '22分钟' },
      { date: '2025-06-01', title: '61活动会场配置缓存失效', impact: '首页加载失败，活动被迫延后1小时开始', duration: '1小时5分钟' }
    ],
    cases: [
      { title: '直播带货秒杀商品缓存击穿', environment: '生产-全量', description: '某头部主播带货商品，缓存失效时瞬间10万QPS打到MySQL，连接池被瞬间耗尽。', solution: '秒杀商品Key物理永不过期，库存变更通过MQ异步更新缓存，前端接入CDN做第一层缓存。' },
      { title: '本地缓存与Redis双写不一致', environment: '生产-应用层', description: '为防止击穿接入Caffeine本地缓存，但各节点更新时序不一致，部分节点读到脏数据。', solution: '本地缓存设置极短TTL（500ms），或通过Redis Pub/Sub广播失效事件通知各节点清理本地缓存。' }
    ]
  }
];

export const serviceLabels: Record<ServiceType, string> = {
  order: '订单服务',
  payment: '支付服务',
  user: '用户服务',
  message: '消息服务',
  database: '数据库',
  cache: '缓存'
};
