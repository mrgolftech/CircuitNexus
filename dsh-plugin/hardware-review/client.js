/**
 * Client half of the Schematic Review workbench.
 *
 * Registers a sidebar panel entry (`sidebar.panellist`, id `hardware-review`)
 * and the matching main-column panel (`main`, key `hardware-review`); the slot
 * catalog states "Each list id addresses the matching main panel".
 *
 * Styling is entirely inline style objects using host theme tokens, matching
 * the profile's existing panel plugins. The optional `styles` builtin is not
 * required, so a missing stylesheet cannot blank the panel.
 *
 * The panel never executes a process: it composes hardwarecheck command lines
 * for the agent, which owns process execution and its approval model.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-plugin-hardware-review',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useCallback, useMemo, useEffect } = React

    const PANEL_ID = 'hardware-review'

    // ---- Build-time snapshot of hardwarecheck rules/review_matrix.json ------
    // Regenerate when the tool repository updates its review matrix.
    const CATALOG = {"meta":{"catalogVersion":"0.5","scope":"OrCAD Capture schematic / PST DAT netlist / schematic PDF / BOM / component datasheets / requirements only. PCB geometry, routing, stackup and layout checks are OUT OF SCOPE.","meaning":"method=baseline_rule only when actual pre-existing rule executes; partial_tool only aids structural checking and NEVER indicates whole item PASS; guided requires human/Agent review and evidence","revisionNote":"Generalized additions to cover component qualification, supply, timing, logic, thermal, EMC, functional safety, manufacturing/test and schematic documentation. Numeric advice is always subject to datasheet and project-specific constraints. 2026-11-02 scope narrowed to schematic-only; deferred PCB/physical-only checks are documented in docs/PCB_FUTURE_HANDOFF.md; old check IDs remain reserved for future separate PCB Skill."},"checks":[{"id":"EDA-01","c":"EDA","t":"核对网表完整性、版本、哈希和格式","e":"网表导出日志与原图","m":"assisted","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"EDA-02","c":"EDA","t":"核对层次网标、跨页同名网络及作用域","e":"原理图层次/端口映射","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"EDA-03","c":"EDA","t":"核对物理管脚号与逻辑功能、隐藏供电脚","e":"网表、PSTCHIP、器件pin table","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"EDA-04","c":"EDA","t":"区分No Connect标记、NC网络、常闭NC触点和DNP","e":"Capture原图及元件属性","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"EDA-05","c":"EDA","t":"同一物理引脚跨网冲突","e":"平面网表结构","m":"baseline_rule","p":"P2","i":true,"r":"","n":"由已有基础规则按具体适用条件执行"},{"id":"EDA-06","c":"EDA","t":"单端网、孤立电气节点、非预期短接","e":"网表、设计意图、原图","m":"baseline_rule","p":"P2","i":true,"r":"","n":"由已有基础规则按具体适用条件执行"},{"id":"EDA-07","c":"EDA","t":"器件型号、封装及多单元部件映射","e":"part list、BOM、封装库","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-01","c":"POWER","t":"识别输入电源及所有电源轨清单","e":"网表网名、供电脚及需求","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-02","c":"POWER","t":"逐级核实电源来源、转换器VIN/VOUT和目标电压","e":"pinmap、datasheet、原图","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-03","c":"POWER","t":"确认每个负载实际电源管脚及独立模拟/数字电源域","e":"VDD/AVDD/VCC引脚数据与网表","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-04","c":"POWER","t":"标出0Ω、磁珠、二极管、负载开关对电源树的影响","e":"BOM装配、器件连接与状态","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-05","c":"POWER","t":"检查多源供电、反灌、OR-ing/电源切换路径","e":"电源树与器件手册","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-06","c":"POWER","t":"输入电压工作范围与绝对最大额定值","e":"需求、手册min/max、输入变化","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-07","c":"POWER","t":"输出电压与下游负载容限","e":"电源树、负载供电规格","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-08","c":"POWER","t":"输出电流及稳态负载预算","e":"逐负载电流max、负载工作模式","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-09","c":"POWER","t":"转换效率、级联输入电流及整机功耗预算","e":"效率曲线、负载剖面、温度","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-10","c":"POWER","t":"启动浪涌、热插拔及软启动","e":"输入电容、限制电路、瞬态测试","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-11","c":"POWER","t":"上电/掉电顺序及域间反灌、倒灌","e":"时序要求、EN/PGOOD、波形","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-12","c":"POWER","t":"PGOOD/RESET/EN链路与拉电平、默认状态","e":"引脚属性、阈值、外围网络","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-13","c":"POWER","t":"电源冗余、掉电保持、后备电池切换","e":"OR-ing、电源监控及要求","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-14","c":"POWER","t":"LDO压差、负载/温度相关裕量","e":"Vin/Vout、dropout曲线、负载","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"POWER-15","c":"POWER","t":"LDO热耗、热阻、结温和降额","e":"Pd=(Vin-Vout)I、PCB热条件","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-16","c":"POWER","t":"DCDC反馈分压、电阻容差及输出精度","e":"Vref、反馈拓扑、阻值、容差","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-17","c":"POWER","t":"DCDC电感量、饱和电流、DCR、纹波","e":"数据手册推荐值和工况","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-18","c":"POWER","t":"DCDC输入/输出电容类型、容值、耐压及偏压降额","e":"实际电容型号、ESR、偏压曲线","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-19","c":"POWER","t":"自举BOOT、电荷泵和补偿网络","e":"推荐应用电路及器件参数","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-20","c":"POWER","t":"开关频率、噪声、同步与EMI风险","e":"手册、频谱限制、布局","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-21","c":"POWER","t":"输出纹波、负载瞬态、线性/负载调整率","e":"模拟/示波器、需求指标","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-22","c":"POWER","t":"电源回路稳定性、相位裕量和负载电容窗口","e":"Bode、补偿方案、手册","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-23","c":"POWER","t":"分域隔离、地参考、模拟电源滤波","e":"网表拓扑、模拟/数字分区","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-24","c":"POWER","t":"去耦器件与供电脚的逻辑关联、容量及耐压选型","e":"原理图连接、供电脚、贴装值、器件推荐去耦网络与额定值","m":"guided","p":"P1","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-25","c":"POWER","t":"过压欠压过流短路与热保护","e":"阈值/故障表、测试方案","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-26","c":"POWER","t":"电源故障恢复、打嗝、锁存和复位行为","e":"datasheet状态机、故障测试","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-27","c":"POWER","t":"电源测试点、测量接地与可维护性","e":"测试网络、PCB测试点","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-28","c":"POWER","t":"待机/睡眠功耗、漏电和电池续航","e":"负载状态、Iq、备用电路","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"POWER-30","c":"POWER","t":"电源域依赖环路与不合理的多级级联","e":"经核验的VIN/VOUT映射","m":"partial_tool","p":"P1","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"PROTECTION-01","c":"PROTECTION","t":"输入反接与电源极性保护","e":"连接器、MOSFET/二极管","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-02","c":"PROTECTION","t":"输入浪涌/电压尖峰/TVS选型","e":"瞬态波形、TVS VRWM/Vc","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-03","c":"PROTECTION","t":"ESD保护器件额定电压、结电容与信号兼容性","e":"保护器件手册、接口最高工作电压/带宽、原理图拓扑","m":"guided","p":"P1","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-04","c":"PROTECTION","t":"熔断器/eFuse额定值、I2t及选择性","e":"最大电流、启动条件、手册","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-05","c":"PROTECTION","t":"高压隔离、爬电间隙和安规要求","e":"输入等级、PCB几何、标准","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-06","c":"PROTECTION","t":"对外接口热插拔、地电位差和异常电压","e":"接口规格、保护拓扑","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-07","c":"PROTECTION","t":"电感/继电器/电机反向能量泄放","e":"续流路径、驱动器手册","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-08","c":"PROTECTION","t":"电池充放电、电源路径和保护阈值","e":"电池/BMS、充电芯片数据","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"PROTECTION-09","c":"PROTECTION","t":"功率MOSFET VGS/VDS、SOA及死区裕量","e":"驱动波形、SOA、安全裕量","m":"guided","p":"P1","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-01","c":"CLOCK","t":"时钟源拓扑、主备时钟与频率准确度","e":"时钟树、频率/抖动需求","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-02","c":"CLOCK","t":"晶体负载电容、ESR和起振裕量","e":"晶体及MCU振荡器手册","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-03","c":"CLOCK","t":"差分时钟端接、摆幅与抖动","e":"时钟源接收器规格及布局","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-04","c":"CLOCK","t":"复位默认态、阈值、上拉和复位电路","e":"上电时序、reset引脚","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-05","c":"CLOCK","t":"Boot strap上下拉与复用引脚状态","e":"Boot模式表、采样窗口","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CLOCK-06","c":"CLOCK","t":"看门狗、故障保护和紧急复位链路","e":"系统功能要求、WDT芯片","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-01","c":"DIGITAL","t":"UART/SBUS方向、电平、反相及帧格式","e":"MCU复用表、接口电平、固件","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-02","c":"DIGITAL","t":"I2C上拉、总线电容、上升时间和地址冲突","e":"上拉阻值、器件地址和电压","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-03","c":"DIGITAL","t":"SPI主从、片选、线长和电平域","e":"片选映射、时序表、PCB","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-04","c":"DIGITAL","t":"RS485终端、偏置、方向控制与隔离","e":"收发器手册、拓扑","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-05","c":"DIGITAL","t":"CAN终端、共模保护和失效保护","e":"线缆拓扑、终端值与收发器","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-06","c":"DIGITAL","t":"GPIO输入容限、驱动能力与总负载","e":"VOH/VOL、VIH/VIL、总负载","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-07","c":"DIGITAL","t":"GPIO默认态和跨电源域反灌","e":"复位态、上电域、保护电路","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-08","c":"DIGITAL","t":"调试接口SWD/JTAG/串口访问与隔离","e":"调试口、量产与安全需求","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"DIGITAL-09","c":"DIGITAL","t":"中断、唤醒、开漏及上下拉需求","e":"芯片pinmux、时序图","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-01","c":"HIGHSPEED","t":"USB接口CC角色、VBUS电气与ESD防护","e":"接口标准、控制器引脚手册、原理图连接及ESD型号","m":"guided","p":"P2","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-02","c":"HIGHSPEED","t":"以太网PHY时钟、磁性器件、MDI端接","e":"PHY手册、RJ45/磁件","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-03","c":"HIGHSPEED","t":"MIPI CSI/DSI lane分配、供电和时钟","e":"主从lane映射、PHY规格","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-04","c":"HIGHSPEED","t":"PCIe参考时钟、复位、PERST和侧带","e":"PCIe规范、芯片手册","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-05","c":"HIGHSPEED","t":"DDR/LPDDR地址映射、供电、终端和时序","e":"原理图、布局约束、DDR规格","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-07","c":"HIGHSPEED","t":"时钟/高速信号跨电源隔离和EMC","e":"域供电、隔离器、PCB","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"HIGHSPEED-08","c":"HIGHSPEED","t":"高速接口连接器选型、pinout及串扰","e":"连接器S参数与板级约束","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-01","c":"ANALOG","t":"ADC参考源、输入共模和量程","e":"ADC引脚及datasheet","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-02","c":"ANALOG","t":"ADC前端RC抗混叠、采样保持驱动","e":"采样时间、阻抗与噪声","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-03","c":"ANALOG","t":"运放输入输出摆幅、带宽、稳定性","e":"运放手册、闭环增益与负载","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-04","c":"ANALOG","t":"分压电阻精度、功率和容差预算","e":"阻值、最大电压、等级","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-05","c":"ANALOG","t":"分流电阻功耗、Kelvin采样和共模","e":"电流范围、布线、放大器","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"ANALOG-06","c":"ANALOG","t":"传感器模拟地/数字地及参考隔离","e":"传感器接口、PCB拓扑","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"BOM-01","c":"BOM","t":"原理图与BOM位号数量一致","e":"CSV BOM/网表","m":"baseline_rule","p":"P2","i":true,"r":"","n":"由已有基础规则按具体适用条件执行"},{"id":"BOM-02","c":"BOM","t":"所有关键器件MPN、等级、封装、供货状态","e":"器件库、BOM、手册","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"BOM-03","c":"BOM","t":"电阻阻值、电容耐压/偏压、温漂和降额","e":"BOM、料号、datasheet","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"BOM-04","c":"BOM","t":"DNP/替代料/装配版本与电路功能","e":"装配BOM及版本说明","m":"partial_tool","p":"P2","i":false,"r":"","n":"仅提供部分结构/约束辅助，不能对整项自动判定PASS"},{"id":"BOM-05","c":"BOM","t":"极性器件、封装方向、Pin1及焊盘标识","e":"元件PCB库、装配图","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"BOM-06","c":"BOM","t":"测试点/工装/可制造性与测试覆盖","e":"生产测试规范、原理图","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"VERIFICATION-01","c":"VERIFICATION","t":"人工核对每个关键电源芯片供电脚/地/FB/EN/PG","e":"原图、芯片管脚表、网表","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"VERIFICATION-02","c":"VERIFICATION","t":"对外接口异常测试和边界工况","e":"接口规定、测试计划","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"VERIFICATION-03","c":"VERIFICATION","t":"高低温、电压上下限及温升联合工况","e":"环境规范、测试计划","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"VERIFICATION-04","c":"VERIFICATION","t":"问题证据、严重度、设计闭环和签核","e":"设计文件版本、评审记录","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"VERIFICATION-05","c":"VERIFICATION","t":"与OrCAD ERC及Allegro DRC结果交叉对照","e":"EDA原生检查报告","m":"guided","p":"P2","i":false,"r":"","n":"需Agent逐项根据证据复核，当前无自动判定规则"},{"id":"CMP-01","c":"COMPONENT","t":"量产器件成熟度及工程样片使用风险","e":"器件量产状态/认证/项目试制阶段","m":"guided","p":"P1","i":false,"r":"工程样片是否允许取决于研发阶段，量产应受控","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-02","c":"COMPONENT","t":"器件生命周期与EOL/PCN替代计划","e":"供应商生命周期声明/PCN/备选料","m":"guided","p":"P1","i":false,"r":"缺少信息仅提示供应链风险","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-03","c":"COMPONENT","t":"关键器件交期与交付进度匹配","e":"采购周期/项目排产计划","m":"guided","p":"P1","i":false,"r":"动态采购信息需核实","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-04","c":"COMPONENT","t":"器件最小起订量与计划用量匹配","e":"MOQ/交货批量/需求预测","m":"guided","p":"P2","i":false,"r":"属于采购可制造性核验","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-05","c":"COMPONENT","t":"封装焊接工艺与代工能力匹配","e":"封装参数/焊厂工艺能力/良率要求","m":"guided","p":"P0","i":false,"r":"细间距BGA及特殊封装重点评估","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-06","c":"COMPONENT","t":"温度等级、环境等级及任务工况匹配","e":"器件温度/湿度/振动规格/任务剖面","m":"guided","p":"P0","i":false,"r":"军品资格按具体项目规范，不预设全部须工业级","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-07","c":"COMPONENT","t":"ESD敏感度与MSL湿敏等级、存储和装配管理","e":"JEDEC MSL/包装/烘烤/防静电工艺","m":"guided","p":"P1","i":false,"r":"敏感度高不自动构成禁用","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-08","c":"COMPONENT","t":"器件电压、电流、功率及温度降额符合项目规范","e":"降额标准/最大额定值/瞬态工况","m":"guided","p":"P0","i":false,"r":"不同电容技术和器件降额系数不可套用常数","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-09","c":"COMPONENT","t":"速度等级及性能裕量选择合理","e":"最高时钟/接口频率/功耗和成本","m":"guided","p":"P2","i":false,"r":"适度选型是优化建议，不是高规格必然有错","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-10","c":"COMPONENT","t":"封装安装形式与装配维护工艺匹配","e":"SMD/THT工艺/机械应力和散热","m":"guided","p":"P2","i":false,"r":"不一律排斥通孔器件","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-11","c":"COMPONENT","t":"数据手册版本、勘误和硬件设计指南已核实","e":"MPN/手册版本/errata/布局指引","m":"guided","p":"P1","i":false,"r":"最新手册应结合量产批次及适用型号","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-12","c":"COMPONENT","t":"供应商资格、质量与合规采购来源","e":"合格供方清单/质量认证/业务合规要求","m":"guided","p":"P1","i":false,"r":"不得按国家地区一刀切判断可靠性","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-13","c":"COMPONENT","t":"非标定制器件的必要性及替代风险","e":"定制规格/成本/维护周期","m":"guided","p":"P2","i":false,"r":"定制料需有项目论证","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-14","c":"COMPONENT","t":"器件类型与供应商整合和标准化","e":"BOM料号种类/标准件策略","m":"guided","p":"P2","i":false,"r":"过度标准化不得影响电气可靠性","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-15","c":"COMPONENT","t":"关键元件订货号、参考价格和备选来源完整","e":"MPN/订货号/价格/替代料批准状态","m":"guided","p":"P1","i":false,"r":"价格和交期是时效数据","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-16","c":"COMPONENT","t":"接插件防呆、错插、键位、极性设计","e":"连接器针位/机械键位/线束定义","m":"guided","p":"P1","i":false,"r":"需机电联合验证","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-17","c":"COMPONENT","t":"阻容标准系列、精度及可采购性","e":"E系列/容差/电性能与供货","m":"guided","p":"P2","i":false,"r":"非标准阻值在功能需要时允许","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-18","c":"COMPONENT","t":"关键元件替代料电气、封装及软件兼容性","e":"主备MPN/封装pinout/电气时序","m":"guided","p":"P1","i":false,"r":"仅料号可替换不代表设计可替换","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-19","c":"COMPONENT","t":"器件可靠性等级与寿命关键工况","e":"可靠性等级/失效率/温升/应力","m":"guided","p":"P1","i":false,"r":"根据产品使用寿命和维护方式适用","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CMP-20","c":"COMPONENT","t":"原理图库符号、物理引脚和封装映射匹配","e":"datasheet pin table/PSTCHIP/PCB封装库","m":"guided","p":"P0","i":false,"r":"多单元和隐藏引脚必须按原图验证","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-01","c":"POWER","t":"电源模块质量、体积、壳体和结构接口","e":"电源模块机械规格/整机结构约束","m":"guided","p":"P1","i":false,"r":"适用于外购电源模块","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-02","c":"POWER","t":"热备/冗余电源单路供电的负载能力与故障隔离","e":"单路电源能力/切换拓扑/故障注入","m":"guided","p":"P0","i":false,"r":"不应只按两路功率相加","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-03","c":"POWER","t":"电源及散热风扇故障监测信号覆盖","e":"风扇FG/锁转/温度报警/PGOOD","m":"guided","p":"P1","i":false,"r":"风扇无监控可按功能降级要求复核","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-04","c":"POWER","t":"电源连接器接触额定电流、并针与冗余及均流","e":"额定电流/温升/接触电阻/线缆","m":"guided","p":"P0","i":false,"r":"并联引脚均流需检查，不能只看总引脚数","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-05","c":"POWER","t":"热插拔连接器先后接触及预充/地回路策略","e":"连接器不同针长/预充/电源时序","m":"guided","p":"P0","i":false,"r":"地电源信号针长并非所有接口通用要求","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-06","c":"POWER","t":"电容耐压与直流偏压、浪涌及失效模式降额","e":"电容技术/厂商降额曲线/最大浪涌","m":"guided","p":"P0","i":false,"r":"钽电容30%等绝对数值不可当普遍标准","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-07","c":"POWER","t":"USB Host VBUS独立限流与短路保护","e":"USB角色/电源开关/电流限值与故障策略","m":"guided","p":"P1","i":false,"r":"应与实际USB规范和主板能力对应","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-08","c":"POWER","t":"电池及板间连接处异常短接/潮湿放电风险","e":"电池路径/插针防护/绝缘/保险","m":"guided","p":"P0","i":false,"r":"电池电源优先评估故障安全","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-09","c":"POWER","t":"电源额定余量与效率、负载范围适配","e":"各负载工况/效率曲线/电源温升","m":"guided","p":"P1","i":false,"r":"50%-80%仅可作为项目策略而非普适硬门槛","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-10","c":"POWER","t":"原理图电源轨标称电压、电流预算和分域说明","e":"原理图注释/设计功耗预算","m":"guided","p":"P1","i":false,"r":"注释不能代替实际计算和测试","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"PWRX-11","c":"POWER","t":"DCDC功率MOSFET开关损耗、RDS(on)及电感DCR匹配","e":"电感DCR/饱和电流/MOSFET手册","m":"guided","p":"P1","i":false,"r":"需计算最坏工况和热裕量","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"TIM-01","c":"TIMING","t":"建立保持时间/最短脉宽在最坏角落满足","e":"时序表/时钟树/布线延迟/PVT","m":"guided","p":"P0","i":false,"r":"时序分析依赖时钟边沿关系和约束","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"TIM-02","c":"TIMING","t":"最高工作频率与系统性能需求、时序裕量","e":"FPGA/MCU/外设频率约束/时序报告","m":"guided","p":"P0","i":false,"r":"不得仅凭标称频率判断","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"TIM-03","c":"TIMING","t":"组合链路传播延迟、竞争与冒险控制","e":"逻辑真值表/门延迟/仿真波形","m":"guided","p":"P1","i":false,"r":"仅从平面网表不能证明时序正常","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"TIM-04","c":"TIMING","t":"输入输出转换速率/慢边沿阈值、亚稳态","e":"器件转换速率条件/波形/同步器","m":"guided","p":"P1","i":false,"r":"门限依器件技术及使用模式","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"TIM-05","c":"TIMING","t":"跨时钟域同步、异步复位解除与启动时序","e":"CDC约束/复位同步策略/仿真","m":"guided","p":"P0","i":false,"r":"需RTL和系统时序信息","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-01","c":"LOGIC","t":"未用逻辑输入脚、开漏输出及悬空风险","e":"物理pin功能/原图/上下拉","m":"guided","p":"P0","i":false,"r":"允许厂商指定的内部终端/NC","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-02","c":"LOGIC","t":"按键、拨码和机械开关去抖","e":"开关波形/RC/施密特/软件策略","m":"guided","p":"P1","i":false,"r":"电路与固件结合核对","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-03","c":"LOGIC","t":"短时掉电/快速重上电的复位可靠性","e":"电源下降曲线/复位芯片迟滞/POR","m":"guided","p":"P0","i":false,"r":"RC复位尤其需实测","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-04","c":"LOGIC","t":"复位期间关键输出与片选处于安全状态","e":"器件reset-state表/片选上下拉/功率负载","m":"guided","p":"P0","i":false,"r":"包括不同电源域及上电先后顺序","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-05","c":"LOGIC","t":"FPGA、CPU、CPLD及寄存器确定复位态","e":"时钟/复位/上电配置文件/手册","m":"guided","p":"P1","i":false,"r":"软硬件联合设计","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-06","c":"LOGIC","t":"有限状态机异常态可恢复与看门狗策略","e":"RTL状态转移表/故障注入/固件","m":"guided","p":"P1","i":false,"r":"原理图不足以全自动证明","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-07","c":"LOGIC","t":"硬件看门狗禁用/调试开关与安全约束","e":"WDT连线/调试策略/安全要求","m":"guided","p":"P1","i":false,"r":"禁用功能应受控，不能破坏安全设计","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-08","c":"LOGIC","t":"可调器件/跳线/拨码默认配置和维护需求","e":"原理图BOM装配变体/调试要求","m":"guided","p":"P1","i":false,"r":"出厂跳线是否安装由产品设计决定","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-09","c":"LOGIC","t":"双向I/O方向争用与短路电流限制","e":"双向口驱动时序/限流/上电状态","m":"guided","p":"P1","i":false,"r":"不可把所有串阻视为必需","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-10","c":"LOGIC","t":"地址总线、存储映射和未来容量兼容性","e":"存储器地址线/时序/选型与扩容规划","m":"guided","p":"P1","i":false,"r":"依具体存储总线类型适用","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-11","c":"LOGIC","t":"MCU/FPGA功能扩展GPIO、保留资源和测试性","e":"管脚分配表/需求与扩展计划","m":"guided","p":"P2","i":false,"r":"非所有量产产品强制预留","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-12","c":"LOGIC","t":"继电器常态与感性负载续流及失效安全","e":"继电器线圈/触点/续流与浪涌回路","m":"guided","p":"P1","i":false,"r":"感性负载可用TVS/RC/有源钳位替代二极管","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-13","c":"LOGIC","t":"复位信号毛刺、EMI及长线抑制","e":"复位拓扑/干扰环境/波形","m":"guided","p":"P0","i":false,"r":"禁止仅按线长判定","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-14","c":"LOGIC","t":"跨模块接插件pinout与信号方向一致性","e":"模块间针脚表/信号功能与电平","m":"guided","p":"P1","i":false,"r":"需检查线束方向视图","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-15","c":"LOGIC","t":"上拉下拉器件可配置及实际阈值裕量","e":"上下拉网络/输入泄漏/电压阈值","m":"guided","p":"P1","i":false,"r":"4.7K/1K仅可能是内部工艺约定","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-16","c":"LOGIC","t":"部分掉电状态的跨域输入钳位与倒灌","e":"供电域时序/引脚绝对额定值/IBIS","m":"guided","p":"P0","i":false,"r":"器件未上电时需检查Ioff/注入电流","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"LOGIC-17","c":"LOGIC","t":"接口板间防短接、线束方向与热插拔状态","e":"互连图/连接器资料/保护策略","m":"guided","p":"P1","i":false,"r":"不以简单网名判断","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"THERM-04","c":"THERMAL","t":"最高结温、壳温和热阻按各器件规格验算","e":"功耗/θJA/θJC/散热器/最大Ta","m":"guided","p":"P0","i":false,"r":"125℃不是所有器件统一限值","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"THERM-07","c":"THERMAL","t":"散热系统失效保障/降额和关断机制","e":"温度报警阈值/功耗调节/保护状态机","m":"guided","p":"P1","i":false,"r":"安全关键设备优先","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-01","c":"EMC","t":"系统EMC试验项目和判据已定义","e":"产品标准/试验等级/端口矩阵","m":"guided","p":"P0","i":false,"r":"不同产品标准不得一刀切","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-02","c":"EMC","t":"外露电源/信号接口的ESD保护器件与连接拓扑","e":"接口原理图、电压域、TVS/ESD器件及其手册","m":"guided","p":"P0","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-03","c":"EMC","t":"外部线缆及通信口浪涌/EFT/雷击防护","e":"线缆类型/法规等级/浪涌等级","m":"guided","p":"P0","i":false,"r":"光纤/隔离接口适用性单独判断","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-04","c":"EMC","t":"线缆屏蔽、滤波、机壳连接与ESD泄放路径","e":"线缆/机壳/地设计/布局","m":"guided","p":"P1","i":false,"r":"屏蔽方式依接口及辐射指标","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-05","c":"EMC","t":"金属/涂层机壳搭接、活动件电连续性","e":"机壳图纸/导电垫片/搭接电阻","m":"guided","p":"P1","i":false,"r":"不能只看原理图符号","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-06","c":"EMC","t":"开孔、缝隙和连接处屏蔽有效性","e":"结构孔径/频谱/电磁仿真与测试","m":"guided","p":"P1","i":false,"r":"与目标频段相关","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-07","c":"EMC","t":"电源输入EMI滤波器架构及阻抗/饱和/温升","e":"滤波器曲线/差共模路径/额定电流","m":"guided","p":"P1","i":false,"r":"是否独立滤波器需标准及试验验证","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-08","c":"EMC","t":"接地/机壳地/模拟地参考策略及共模回路","e":"地分区/机壳/回流路径/布局","m":"guided","p":"P1","i":false,"r":"不应一律切割地平面","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-09","c":"EMC","t":"关键复位、时钟、密钥/安全线抗扰措施","e":"接口敏感度/ESD/EMI/滤波","m":"guided","p":"P1","i":false,"r":"依实际安全需求适用","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-10","c":"EMC","t":"差分/双极性接口抑制器件极性与结电容","e":"电平范围/TVS Vwm与钳位/速率","m":"guided","p":"P1","i":false,"r":"并非所有差分口必须双向TVS","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-11","c":"EMC","t":"开关电源/高速噪声的频率错相和频谱扩展策略","e":"多负载时钟相位/EMI实测与约束","m":"guided","p":"P1","i":false,"r":"错相可能影响同步，应核对时序","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"EMC-12","c":"EMC","t":"电源/接口滤波元件额定电压电流与失效模式","e":"DC/AC额定/波形/温度/证据","m":"guided","p":"P1","i":false,"r":"滤波器自身也需降额","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-01","c":"SAFETY","t":"非隔离或非限流输入电源短路及过温保护","e":"保险/eFuse/开关策略/最大故障电流","m":"guided","p":"P0","i":false,"r":"按风险等级选适合保护","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-02","c":"SAFETY","t":"保险规格、标识、可更换性和维护策略","e":"熔断器I2t/装配/维修规范","m":"guided","p":"P1","i":false,"r":"备用保险是否配发属产品策略","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-03","c":"SAFETY","t":"电源模块、连接器、线束和滤波器安规资格","e":"设备标准/零件认证/认证等级","m":"guided","p":"P0","i":false,"r":"需保持整机认证边界","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-04","c":"SAFETY","t":"电池和电解液泄漏/短路/鼓胀风险控制","e":"电池技术/机械防护/BMS/环境条件","m":"guided","p":"P0","i":false,"r":"按化学体系与标准核对","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-05","c":"SAFETY","t":"RS232及其他外接口带电插拔、隔离和限流","e":"收发器绝对值/隔离/热插拔条件","m":"guided","p":"P1","i":false,"r":"100Ω固定串阻并非通用设计规则","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-06","c":"SAFETY","t":"极性器件在正/负电源和浪涌工况下方向正确","e":"电容/TVS/LED/肖特基实物pinout","m":"guided","p":"P1","i":false,"r":"DNP/备选封装应单独检查","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-07","c":"SAFETY","t":"继电器、负载开关和电机短路下的失效安全行为","e":"原理图/保护门限/故障检测","m":"guided","p":"P0","i":false,"r":"覆盖线圈续流与负载触点风险","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"SAFETY-08","c":"SAFETY","t":"特殊IC卡/备份供电接口的触点短路保护","e":"接口规范/串阻/ESD/备用电池路径","m":"guided","p":"P1","i":false,"r":"仅适用于该类器件，禁止通用固定阻值","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-01","c":"DFX","t":"主控/FPGA/CPLD板上编程与测试下载能力","e":"JTAG/SWD/ISP链路/生产工装","m":"guided","p":"P1","i":false,"r":"安全策略可限制量产访问","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-02","c":"DFX","t":"电源/复位/总线关键测试点覆盖与可探测性","e":"网表测试点/PCB定位/测试计划","m":"guided","p":"P1","i":false,"r":"高速与高阻抗节点探测可能改变电路","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-03","c":"DFX","t":"开机自检和关键故障可诊断性","e":"传感器/电源状态位/软件策略","m":"guided","p":"P1","i":false,"r":"覆盖率需列清单，不能仅凭LED","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-04","c":"DFX","t":"异常事件日志、故障保持与追溯能力","e":"MCU日志/非易失存储/复位原因","m":"guided","p":"P1","i":false,"r":"可靠性和信息安全要求兼顾","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-05","c":"DFX","t":"关键运行状态灯或诊断接口","e":"电源/故障状态需求/接口定义","m":"guided","p":"P2","i":false,"r":"不必强制每块板有LED","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-06","c":"DFX","t":"测试工装可连接性、定位和可维护性","e":"连接器间距/机械结构/测试计划","m":"guided","p":"P1","i":false,"r":"跨结构PCB工艺共同验收","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-07","c":"DFX","t":"制造装配变体、BOM标注及不贴装件记录","e":"装配BOM/DNP/焊接图/固件版本","m":"guided","p":"P1","i":false,"r":"禁止将采购BOM直接当已装配状态","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-08","c":"DFX","t":"设备工作模式、自检和调试进入条件","e":"Boot/模式脚/固件/产线配置","m":"guided","p":"P1","i":false,"r":"安全功能不得意外开启","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-09","c":"DFX","t":"信号扩展、预留管脚和未来升级约束","e":"需求路线图/接口管脚表","m":"guided","p":"P2","i":false,"r":"不是强制全产品预留","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DFX-10","c":"DFX","t":"温度/电源状态故障检测与恢复演练","e":"故障注入/工装/日志/验收指标","m":"guided","p":"P1","i":false,"r":"需原理图与固件联合测试","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-01","c":"DOCUMENTATION","t":"图纸页标题、文件名、版本、页码和设计责任","e":"Capture页框/版本控制/图纸模板","m":"guided","p":"P2","i":false,"r":"属于文档检查，不靠平面网表推断","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-02","c":"DOCUMENTATION","t":"交叉连线接点与无连接交叉线语义明确","e":"原理图图形/junction规则/ERC","m":"guided","p":"P1","i":false,"r":"绘图工具不同符号需核对","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-03","c":"DOCUMENTATION","t":"元件标号/数值/封装/特殊额定信息齐全","e":"原理图属性/BOM/原图库","m":"guided","p":"P2","i":false,"r":"无封装器件应说明豁免","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-04","c":"DOCUMENTATION","t":"元器件参考位号命名统一及符号可读性","e":"原理图命名标准/图纸检查","m":"guided","p":"P2","i":false,"r":"不将个别命名习惯硬编码","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-05","c":"DOCUMENTATION","t":"原理图页布局、图框、字体和打印可读性","e":"原理图页面/PDF输出","m":"guided","p":"P2","i":false,"r":"需查看图纸，非DAT-only","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-06","c":"DOCUMENTATION","t":"系统功能框图及关键电源时钟接口框图完整","e":"设计需求/原理图首页/架构图","m":"guided","p":"P1","i":false,"r":"可结合装置复杂度调整","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-07","c":"DOCUMENTATION","t":"原理图库与datasheet物理pin/符号/封装一致","e":"MPN/封装pin map/实际库文件","m":"guided","p":"P0","i":false,"r":"不能根据网名确定电源管脚","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-08","c":"DOCUMENTATION","t":"未连接引脚使用标准No Connect标记而非伪NC网","e":"Capture源图/NC属性/ERC报告","m":"guided","p":"P1","i":false,"r":"NC继电器触点与No Connect需区分","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-09","c":"DOCUMENTATION","t":"全部ERC/DRC告警已分类、豁免有依据","e":"ERC/DRC报告/白名单/修订记录","m":"guided","p":"P1","i":false,"r":"非全部告警必须清零但必须闭环","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-10","c":"DOCUMENTATION","t":"全局网名、总线位序、跨页连接一致","e":"Net/HierPorts/总线位号和端口映射","m":"guided","p":"P1","i":false,"r":"Bus[3:0]与Bus[0:3]按工具语义核查","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-11","c":"DOCUMENTATION","t":"被动器件数值单位、前缀和表示方式规范","e":"CAD属性规范/BOM导出规则","m":"guided","p":"P2","i":false,"r":"4K7与4.7K等可以格式归一但电气等价","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-12","c":"DOCUMENTATION","t":"原理图显式电源/地管脚、避免隐藏连接误判","e":"原理图symbol pin属性/PSTCHIP","m":"guided","p":"P1","i":false,"r":"是否必须显示由图纸规范决定","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-13","c":"DOCUMENTATION","t":"电源电流预算、关键器件约束及原理图设计说明是否完整","e":"原理图标注、负载预算、器件设计要求及数据手册","m":"guided","p":"P1","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-14","c":"DOCUMENTATION","t":"关键元件手册、勘误和审查决议可追溯","e":"来源URL/版本/日期/审查记录","m":"guided","p":"P1","i":false,"r":"防止型号A引用型号B参数","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DOC-15","c":"DOCUMENTATION","t":"器件属性与BOM中等效单位/封装写法标准化","e":"元件库/BOM值和Footprint映射","m":"guided","p":"P2","i":false,"r":"不因格式差异误判电气错误","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-01","c":"DIGITAL","t":"输出VOH/VOL与输入VIH/VIL的静态噪声裕量","e":"驱动/接收双方datasheet及工作条件","m":"guided","p":"P0","i":false,"r":"VIH并非max允许输入电压","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-02","c":"DIGITAL","t":"输入绝对最大额定电压与过冲、钳位电流","e":"Vmax/Vmin/绝对最大和电源先后","m":"guided","p":"P0","i":false,"r":"不能用VIHmax取代abs max","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-03","c":"DIGITAL","t":"输出驱动/灌电流对总线扇出及输入漏电余量","e":"IOH/IOL/IIH/IIL和负载总和","m":"guided","p":"P1","i":false,"r":"低电平使用电流幅值及温度边界","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-04","c":"DIGITAL","t":"驱动输出电容负载与慢边沿转换时间","e":"driver CLmax/PCB容性负载/时钟","m":"guided","p":"P1","i":false,"r":"CLmax不是所有驱动唯一约束","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-05","c":"DIGITAL","t":"负电压/上电过冲引起的CMOS注入电流和闩锁","e":"输入钳位/绝对限值/电源时序/波形","m":"guided","p":"P0","i":false,"r":"二极管导通估算不能替代手册Iinj","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"DIGX-06","c":"DIGITAL","t":"继电器、蜂鸣器和风扇等电磁负载抑制","e":"驱动MOS/释放波形/续流回路","m":"guided","p":"P1","i":false,"r":"二极管、TVS和有源钳位择优","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"HIGX-01","c":"HIGHSPEED","t":"高速信号边沿速率、接口标准与驱动/端接配置","e":"原理图接口拓扑、器件Tr/Tf与驱动能力、端接建议","m":"guided","p":"P1","i":false,"r":"仅核查原理图层面的电气与拓扑要求；物理长度、过孔、摆放、铜皮和回流不在本Skill范围","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"HIGX-02","c":"HIGHSPEED","t":"连接器高速损耗、寄生参数、参考地分配","e":"连接器S参数/引脚分配/目标带宽","m":"guided","p":"P1","i":false,"r":"差分对需完整回流和串扰分析","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"HIGX-03","c":"HIGHSPEED","t":"同总线高低速负载隔离/负载开关控制","e":"总线拓扑/最大电容/器件时序","m":"guided","p":"P1","i":false,"r":"总线开关非普遍强制","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"HIGX-05","c":"HIGHSPEED","t":"未使用高速连接器管脚的端接/隔离策略","e":"连接器协议/芯片unused pin指南","m":"guided","p":"P1","i":false,"r":"禁止普遍用0.1uF将闲置金手指接地","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CLOCKX-01","c":"CLOCK","t":"晶体高次谐波振荡模式匹配与附加滤波","e":"晶体类型/振荡器选型/厂商推荐应用","m":"guided","p":"P1","i":false,"r":"仅在高次谐波晶体模式适用","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CLOCKX-02","c":"CLOCK","t":"晶振缓冲输出/时钟诊断测试点可用性","e":"时钟管脚输出能力/测试点与波形","m":"guided","p":"P1","i":false,"r":"不应直接探测易受影响晶体谐振脚","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CLOCKX-03","c":"CLOCK","t":"有源/无源晶振选择基于功耗、成本、精度","e":"晶体误差/起振/功耗/总体BOM","m":"guided","p":"P2","i":false,"r":"有源不总是更优","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CLOCKX-04","c":"CLOCK","t":"晶振OE/EN脚上电默认电平与供应商兼容","e":"封装pin1定义/上下拉/厂家手册","m":"guided","p":"P1","i":false,"r":"不同厂家pin1并非一律EN","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"},{"id":"CLOCKX-05","c":"CLOCK","t":"专用复位监控芯片输出端外围负载适配","e":"具体型号/输出级/复位时序/上下拉","m":"guided","p":"P1","i":false,"r":"禁用固定100K之类经验值当通用规则","n":"Agent-guided evidence review; no deterministic electrical verdict without design and datasheet evidence"}]}

    /**
     * Compare two check ids by prefix then numeric suffix, so POWER-2 sorts
     * before POWER-10 and a category always reads in catalogue order.
     */
    function compareIds(a, b) {
      const ma = String(a).match(/^(.*?)(\d+)$/)
      const mb = String(b).match(/^(.*?)(\d+)$/)
      if (!ma || !mb) return String(a).localeCompare(String(b))
      if (ma[1] !== mb[1]) return ma[1].localeCompare(mb[1])
      return parseInt(ma[2], 10) - parseInt(mb[2], 10)
    }

    /** Group detail lines by category so the instruction stays readable. */
    function groupByCategory(checks) {
      const by = {}
      for (const c of checks) {
        if (!by[c.c]) by[c.c] = []
        by[c.c].push(c)
      }
      return Object.keys(by)
        .sort((a, b) => by[b].length - by[a].length)
        .map(cat => ({ category: cat, items: by[cat] }))
    }

    /**
     * The task handed to the new Session's composer.
     *
     * This states only WHAT to review — the directory and the exact check ids
     * the user selected. HOW to review (evidence gates, workflow, reporting
     * format, what counts as verified) is owned by the hw-review
     * Skill, which the agent loads itself; restating it here would duplicate
     * that Skill with a worse copy.
     */
    function reviewInstruction(plan) {
      const groups = groupByCategory(plan.chosen)
      const ids = plan.chosen.map(c => c.id)
      const lines = []
      lines.push('第一步：先只做文件清点，不要开始审查。')
      lines.push('')
      lines.push('目标目录：' + plan.dir)
      lines.push('')
      lines.push('请列出该目录及其子目录中的文件，并逐项告诉我是否找到：')
      lines.push('  - pstxnet.dat（必需，网络与物理引脚连通性）')
      lines.push('  - pstxprt.dat（必需，器件身份）')
      lines.push('  - pstchip.dat（库 VALUE / 封装 / DNP 标记）')
      lines.push('  - 装配 BOM（CSV）')
      lines.push('  - 原理图 PDF')
      lines.push('  - 关键器件的数据手册 PDF')
      lines.push('  - OrCAD ERC / Allegro DRC 报告（如有）')
      lines.push('')
      lines.push('每项写「找到 <文件名>」或「未找到」，并说明在哪个子目录。')
      lines.push('如果缺少 pstxnet.dat 或其他必需输入，明确说明缺哪几项，'
        + '以及会导致哪些检查项无法验证。')
      lines.push('')
      lines.push('清点完成后停下来，等我确认再继续。')
      lines.push('')
      lines.push('---')
      lines.push('')
      lines.push('我确认后，按下面范围执行审查：')
      lines.push('先加载 hw-review Skill，遵循它的证据门槛与报告规范。')
      lines.push('')
      lines.push('审查范围：下列 ' + ids.length + ' 个检查项（按 Skill 的 199 项清单编号）。')
      lines.push('只做这些条目；清单里其他条目本次不在范围内。')
      lines.push('')
      for (const g of groups) {
        lines.push('【' + (CATEGORY_LABEL[g.category] || g.category) + '】')
        for (const c of g.items) {
          lines.push('  ' + c.id + '  ' + c.t)
        }
        lines.push('')
      }
      lines.push('按 Skill 规定的证据门槛和报告格式输出，逐条给出结论与依据，'
        + '并明确标出哪些条目因缺少材料而未能验证。')
      return lines.join('\n')
    }

    // ---- Launch --------------------------------------------------------------

    /** How long a Session may take to open before the launch gives up. */
    const SESSION_OPEN_TIMEOUT_MS = 6000

    /** Reject instead of waiting forever, so a stuck open cannot spin the UI. */
    function withTimeout(promise, ms, message) {
      let timer
      const guard = new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      })
      return Promise.race([promise, guard]).finally(() => clearTimeout(timer))
    }

    /**
     * Hand `text` to an existing Session's Agent as a real user turn.
     *
     * This is what separates "the Agent started" from "something was typed for
     * me": `uiWorkspace.startSession(…, { prompt })` only stages a composer
     * draft, while `ISession.prompt` admits the text through the same path the
     * composer uses on Enter — the Host resumes the Session and starts the turn
     * immediately.
     *
     * `sessions.retain` is the Client-side accessor that opens a Session from
     * outside the Conversation panel, and its `binding.session` is the Agent's
     * own face. The reference is released on every path so the panel never pins
     * a Session open.
     *
     * Returns true when the Agent accepted the prompt, false when this build
     * exposes no direct dispatch, and throws when the Host refuses it.
     */
    async function dispatchToAgent(ctx, sessionId, text) {
      const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
      if (!sessions || typeof sessions.retain !== 'function') return false
      const reference = sessions.retain(sessionId, { source: 'controllerOperation' })
      try {
        const binding = await withTimeout(
          reference.ready, SESSION_OPEN_TIMEOUT_MS, '会话没有在预期时间内打开',
        )
        const session = binding && binding.session
        if (!session || typeof session.prompt !== 'function') return false
        const result = await session.prompt([{ type: 'text', text }], 'queue')
        if (result && result.ok === false) {
          const failure = result.error || {}
          throw new Error(failure.message || failure.code || '会话拒绝接收该指令')
        }
        return true
      } finally {
        try {
          if (reference && typeof reference.release === 'function') reference.release()
        } catch { /* releasing is best-effort */ }
      }
    }

    /**
     * Start one review: register the Workspace, create the Session, dispatch.
     *
     * Delivery is reported instead of assumed:
     *   'agent' — the instruction became a user turn; the Agent is running.
     *   'draft' — direct dispatch was unavailable, so the text was staged into
     *             the composer as a fallback and still needs an Enter.
     *   'none'  — not even a draft could be staged; only the Workspace opened.
     */
    async function startReview(ctx, plan) {
      const ws = ctx && ctx.get ? ctx.get('workspaces') : undefined
      const ui = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
      const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
      if (!ws || typeof ws.create !== 'function') {
        throw new Error('当前环境未提供 workspaces 服务，无法建立工作区。')
      }

      const view = await ws.create({ path: plan.dir })
      const text = reviewInstruction(plan)
      let sessionId = null
      let delivery = 'none'
      let warning = ''

      if (sessions && typeof sessions.create === 'function') {
        // Create the Session explicitly: dispatch needs its id, and
        // `uiWorkspace.startSession` returns void.
        sessionId = await sessions.create({ workspaceId: view.workspaceId })
        if (ui && typeof ui.openSession === 'function') {
          try { ui.openSession(sessionId) } catch { /* navigation is best-effort */ }
        }
        try {
          if (await dispatchToAgent(ctx, sessionId, text)) delivery = 'agent'
          else warning = '当前客户端没有暴露会话的 prompt 接口'
        } catch (error) {
          warning = (error && error.message) || String(error)
        }
      } else {
        warning = '当前客户端没有暴露 sessions 服务'
      }

      if (delivery !== 'agent') {
        if (ui && typeof ui.startSession === 'function') {
          // Fallback only: a composer draft still needs the user to press Enter.
          try {
            ui.startSession(view.workspaceId, { prompt: text, whenDraftExists: 'replace' })
            delivery = 'draft'
          } catch (error) {
            if (!warning) warning = (error && error.message) || String(error)
          }
        } else if (ui && typeof ui.connectWorkspace === 'function') {
          await ui.connectWorkspace(view.workspaceId)
        }
      }

      return {
        sessionId, workspaceId: view && view.workspaceId, text, delivery, warning,
      }
    }

    // ---- Task store ----------------------------------------------------------
    // One task per started review. Persisted so the panel still lists them
    // after a restart; the review itself lives in its Session, so a task is a
    // durable pointer plus what we knew at launch time.
    const STORAGE_KEY = 'dsh.hardware-review.tasks.v1'

    /** Read the stored task list, tolerating absent or corrupt data. */
    function loadTasks() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter(t => t && typeof t === 'object' && t.id && t.dir)
      } catch {
        return []
      }
    }

    function saveTasks(tasks) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(0, 40)))
      } catch {
        /* private mode or quota: the panel still works, it just forgets */
      }
    }

    function newTaskId() {
      return 'task-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)
    }

    /** Subscribe to a task store shared by every panel instance. */
    function useTaskStore() {
      const [tasks, setTasks] = useState(loadTasks)
      const write = useCallback(next => {
        setTasks(next)
        saveTasks(next)
      }, [])
      return { tasks, write }
    }

    // ---- Theme tokens (kept as names so light/dark both work) ----------------
    const T = {
      bg: 'var(--dsw-alias-bg-base)',
      layer1: 'var(--dsw-alias-bg-layer-1)',
      layer2: 'var(--dsw-alias-bg-layer-2)',
      overlay: 'var(--dsw-alias-bg-overlay)',
      border1: 'var(--dsw-alias-border-l1)',
      border2: 'var(--dsw-alias-border-l2)',
      brand: 'var(--dsw-alias-brand-primary)',
      text: 'var(--dsw-alias-label-primary)',
      text2: 'var(--dsw-alias-label-secondary)',
      idle: 'var(--dsw-alias-state-idle-primary)',
      warn: 'var(--dsw-alias-state-warn-primary)',
      ok: 'var(--dsw-alias-state-success-primary)',
      err: 'var(--dsw-alias-state-error-primary)',
    }
    const MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace'

    // ---- Reusable style objects ---------------------------------------------
    const S = {
      root: {
        display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0,
        boxSizing: 'border-box', background: T.bg, color: T.text,
        fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
      },
      header: {
        flex: 'none', padding: '22px 28px 0',
        borderBottom: '1px solid ' + T.border1,
      },
      headerRow: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, marginBottom: 14,
      },
      h1: { margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.3 },
      sub: { color: T.text2, fontSize: 13, whiteSpace: 'nowrap' },
      tabRow: { display: 'flex', gap: 4 },
      tab: (on) => ({
        appearance: 'none', background: 'transparent', border: 'none',
        borderBottom: '2px solid ' + (on ? T.brand : 'transparent'),
        color: on ? T.text : T.text2,
        padding: '8px 12px 9px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: on ? 600 : 400, whiteSpace: 'nowrap',
      }),
      body: {
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '20px 28px 36px',
      },
      card: {
        background: T.layer1, border: '1px solid ' + T.border1,
        borderRadius: 12, padding: '16px 18px', marginBottom: 14,
      },
      cardTitle: {
        margin: '0 0 4px', fontSize: 13, fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 8,
      },
      cardHint: { color: T.text2, fontSize: 12, marginBottom: 14, lineHeight: 1.5 },
      field: { marginBottom: 12 },
      label: {
        display: 'block', fontSize: 12, fontWeight: 600,
        color: T.text2, marginBottom: 5,
      },
      input: {
        width: '100%', boxSizing: 'border-box', background: T.layer2,
        border: '1px solid ' + T.border1, borderRadius: 8,
        padding: '8px 11px', color: T.text, font: 'inherit', fontSize: 13,
      },
      inputMono: {
        width: '100%', boxSizing: 'border-box', background: T.layer2,
        border: '1px solid ' + T.border1, borderRadius: 8,
        padding: '8px 11px', color: T.text, fontFamily: MONO, fontSize: 12,
      },
      row: { display: 'flex', alignItems: 'center', gap: 8 },
      btn: {
        appearance: 'none', border: '1px solid ' + T.border1,
        background: T.layer2, color: T.text, borderRadius: 8,
        padding: '8px 14px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, whiteSpace: 'nowrap',
      },
      btnPrimary: {
        appearance: 'none', border: '1px solid ' + T.brand,
        background: T.brand, color: '#fff', borderRadius: 8,
        padding: '8px 16px', cursor: 'pointer', font: 'inherit',
        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
      },
      btnDisabled: { opacity: 0.45, cursor: 'not-allowed' },
      check: { marginTop: 2, accentColor: T.brand, cursor: 'pointer', flex: 'none' },
      cmd: {
        background: T.layer2, border: '1px solid ' + T.border1,
        borderRadius: 9, padding: '11px 13px', marginBottom: 10,
      },
      badge: (tone) => {
        const color = tone === 'warn' ? T.warn : tone === 'ok' ? T.ok
          : tone === 'err' ? T.err : T.text2
        return {
          display: 'inline-block', padding: '1px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 600, color,
          border: '1px solid ' + color, whiteSpace: 'nowrap',
        }
      },
      /**
       * Priority badge: P0 red, P1 orange, P2 grey. A filled chip rather than
       * an outline, so the three levels stay distinguishable at a glance in
       * both themes.
       */
      priority: (p) => {
        const color = p === 'P0' ? T.err : p === 'P1' ? T.warn : T.text2
        const filled = p === 'P0' || p === 'P1'
        return {
          display: 'inline-block', padding: '1px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
          color: filled ? '#fff' : T.text2,
          background: filled
            ? color
            : 'color-mix(in srgb, ' + T.text2 + ' 16%, transparent)',
          border: '1px solid ' + (filled ? color
            : 'color-mix(in srgb, ' + T.text2 + ' 34%, transparent)'),
        }
      },
      statGrid: {
        display: 'grid', gap: 8,
        gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
      },
      stat: {
        background: T.layer2, borderRadius: 8, padding: '9px 11px',
        border: '1px solid ' + T.border1,
      },
      statK: { fontSize: 11, color: T.text2, marginBottom: 2 },
      statV: {
        fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
      },
      list: { display: 'flex', flexDirection: 'column', gap: 7 },
      item: {
        border: '1px solid ' + T.border1, background: T.layer1,
        borderRadius: 9, padding: '10px 12px',
      },
      itemTop: {
        display: 'flex', alignItems: 'baseline',
        justifyContent: 'space-between', gap: 10,
      },
      empty: {
        textAlign: 'center', color: T.text2, padding: '48px 20px', fontSize: 13,
      },
      ul: { margin: 0, paddingLeft: 18, color: T.text2, fontSize: 12.5, lineHeight: 1.75 },
      path: { fontFamily: MONO, fontSize: 11.5, color: T.text2, wordBreak: 'break-all' },

      // ---- Step 2: check selection ----
      stepNum: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, borderRadius: '50%', flex: 'none',
        background: T.brand, color: '#fff', fontSize: 11, fontWeight: 700,
      },
      /** One horizontal category tab; the active one carries the shared accent. */
      catTab: (on) => ({
        appearance: 'none', cursor: 'pointer', font: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap',
        fontSize: 12.5, fontWeight: on ? 600 : 400,
        border: '1px solid ' + (on ? T.brand : T.border1),
        background: on ? catTint(16) : 'transparent',
        color: on ? T.text : T.text2,
        transition: 'border-color .12s, background .12s',
      }),
      /** Header strip above the visible list of one category. */
      catBar: {
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', margin: '4px 0 10px',
      },
      catName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
      catCount: {
        fontSize: 11.5, color: T.text2, fontVariantNumeric: 'tabular-nums',
      },
      checkList: {
        display: 'flex', flexDirection: 'column',
        border: '1px solid ' + T.border1, borderRadius: 10, overflow: 'hidden',
      },
      checkRow: (on) => ({
        display: 'flex', alignItems: 'flex-start', gap: 9,
        padding: '10px 12px',
        borderTop: '1px solid ' + T.border1,
        background: on ? T.layer2 : 'transparent',
        cursor: 'pointer',
      }),
      check: { marginTop: 2, accentColor: T.brand, cursor: 'pointer', flex: 'none' },
      checkTop: { display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
      checkId: {
        fontFamily: MONO, fontSize: 11, fontWeight: 600,
        color: T.brand, flex: 'none',
      },
      checkTitle: { fontSize: 12.5, lineHeight: 1.45 },
      checkMeta: { fontSize: 11, color: T.text2, marginTop: 3, lineHeight: 1.45 },
      miniBtn: {
        appearance: 'none', border: '1px solid ' + T.border1,
        background: 'transparent', color: T.text2, borderRadius: 6,
        padding: '3px 9px', cursor: 'pointer', font: 'inherit', fontSize: 11.5,
        whiteSpace: 'nowrap',
      },
      sumRow: {
        display: 'flex', gap: 8, alignItems: 'baseline',
        padding: '5px 0', borderBottom: '1px solid ' + T.border1,
      },
    }

    /**
     * The Client context captured at apply() time. Slot views are plain
     * components with no context of their own, so services are read from here.
     */
    const ctxRef = { current: null }

    /** Hover-aware button. */
    function Button({ primary, disabled, onClick, children, style }) {
      const [hover, setHover] = useState(false)
      const base = primary ? S.btnPrimary : S.btn
      return h('button', {
        type: 'button',
        disabled,
        onClick,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
        style: {
          ...base,
          ...(disabled ? S.btnDisabled : null),
          ...(hover && !disabled
            ? (primary ? { filter: 'brightness(1.08)' } : { borderColor: T.border2, background: T.overlay })
            : null),
          ...style,
        },
      }, children)
    }

    /** Copy-to-clipboard with transient confirmation. */
    function CopyButton({ text }) {
      const [done, setDone] = useState(false)
      const onClick = useCallback(() => {
        const promise = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(text)
          : Promise.reject(new Error('clipboard unavailable'))
        promise.then(() => {
          setDone(true); setTimeout(() => setDone(false), 1400)
        }).catch(() => setDone(false))
      }, [text])
      const [hover, setHover] = useState(false)
      return h('button', {
        type: 'button', onClick,
        onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
        style: {
          ...S.btn, padding: '5px 11px', fontSize: 12,
          ...(hover ? { borderColor: T.border2, background: T.overlay } : null),
          ...(done ? { color: T.ok, borderColor: T.ok } : null),
        },
      }, done ? '✓ 已复制' : '复制')
    }

    // ------------------------------------------------------------- Design tab

    /**
     * Category accents are uniform: every category tab uses the same brand
     * colour, so the strip reads as one control instead of a colour key.
     */
    function catTint(pct) {
      return 'color-mix(in srgb, var(--dsw-alias-brand-primary) ' + (pct || 12)
        + '%, transparent)'
    }

    /** Category display names, in the order the user should think about them. */
    const CATEGORY_LABEL = {
      POWER: '电源',
      COMPONENT: '器件',
      LOGIC: '逻辑与复位',
      DIGITAL: '数字接口',
      DOCUMENTATION: '图纸文档',
      EMC: 'EMC 与防护',
      CLOCK: '时钟与晶振',
      HIGHSPEED: '高速接口',
      DFX: '可制造可测试',
      PROTECTION: '保护电路',
      SAFETY: '安全',
      EDA: '网表与 EDA',
      ANALOG: '模拟',
      BOM: 'BOM 与物料',
      VERIFICATION: '验证与签核',
      TIMING: '时序',
      THERMAL: '热设计',
    }

    function DesignTab({ store, onOpenTask }) {
      const [dir, setDir] = useState('')
      const [pickBusy, setPickBusy] = useState(false)
      const [pickError, setPickError] = useState('')
      const [checked, setChecked] = useState({})
      const [activeCategory, setActiveCategory] = useState(null)
      const [priorityFilter, setPriorityFilter] = useState('ALL')
      const [confirm, setConfirm] = useState(null)
      const [launching, setLaunching] = useState(false)
      const [result, setResult] = useState(null)

      const allChecks = (CATALOG && CATALOG.checks) || []

      /** Group the catalog by category once, keeping priority order inside. */
      const groups = useMemo(() => {
        const by = {}
        for (const c of allChecks) {
          if (!by[c.c]) by[c.c] = []
          by[c.c].push(c)
        }
        const order = Object.keys(by).sort((a, b) => by[b].length - by[a].length)
        return order.map(cat => {
          // Order by the check's own number so a category reads 01, 02, 03…
          // Priority is a badge, not the sort key.
          const items = by[cat].slice().sort((x, y) => compareIds(x.id, y.id))
          return {
            category: cat,
            label: CATEGORY_LABEL[cat] || cat,
            items,
            p0: items.filter(i => i.p === 'P0').length,
            p1: items.filter(i => i.p === 'P1').length,
            p2: items.filter(i => i.p === 'P2').length,
            auto: items.filter(i => i.i).length,
          }
        })
      }, [allChecks])

      const selectedIds = useMemo(
        () => Object.keys(checked).filter(k => checked[k]), [checked])

      // Open on the biggest category so the first view is useful.
      const active = activeCategory || (groups[0] && groups[0].category)
      useEffect(() => {
        if (!activeCategory && groups.length) setActiveCategory(groups[0].category)
      }, [activeCategory, groups])

      /** Which checks are visible under the current priority filter. */
      const visible = useCallback(item => {
        if (priorityFilter === 'ALL') return true
        return item.p === priorityFilter
      }, [priorityFilter])

      const toggleOne = useCallback(id => {
        setChecked(p => ({ ...p, [id]: !p[id] }))
      }, [])

      /** Select every check in one category (respecting the priority filter). */
      const toggleGroup = useCallback((g, on) => {
        setChecked(prev => {
          const next = { ...prev }
          for (const item of g.items) {
            if (visible(item)) next[item.id] = on
          }
          return next
        })
      }, [visible])

      const selectPreset = useCallback(which => {
        const next = {}
        if (which === 'none') { setChecked({}); return }
        for (const c of allChecks) {
          if (which === 'p0') { if (c.p === 'P0') next[c.id] = true }
          else if (which === 'p0p1') { if (c.p === 'P0' || c.p === 'P1') next[c.id] = true }
          else if (which === 'all') { next[c.id] = true }
        }
        setChecked(next)
      }, [allChecks])

      /**
       * Ask the Host half which input files the directory holds. The browser
       * cannot list a directory in this profile, so this goes through the
       * package's own Host RPC channel.
       */
      const pick = useCallback(async () => {
        setPickError('')
        const ctx = ctxRef.current
        const svc = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
        if (!svc || typeof svc.pickDirectory !== 'function') {
          setPickError('当前环境未提供目录选择服务，请直接在输入框中粘贴路径。')
          return
        }
        setPickBusy(true)
        try {
          const chosen = await svc.pickDirectory()
          if (chosen) {
            setDir(chosen)
            setResult(null)
          }
        } catch (error) {
          setPickError('选择目录失败：' + ((error && error.message) || String(error)))
        }
        setPickBusy(false)
      }, [])

      const askConfirm = useCallback(() => {
        const ids = selectedIds
        if (!dir.trim() || !ids.length) return
        const chosen = allChecks.filter(c => checked[c.id])
        setConfirm({ dir: dir.trim(), chosen })
        setResult(null)
      }, [dir, checked, selectedIds, allChecks])

      const launch = useCallback(async () => {
        const plan = confirm
        if (!plan) return
        setLaunching(true)
        try {
          const started = await startReview(ctxRef.current, plan)
          const task = {
            id: newTaskId(),
            dir: plan.dir,
            ids: plan.chosen.map(c => c.id),
            workspaceId: started.workspaceId,
            sessionId: started.sessionId,
            delivery: started.delivery,
            createdAt: Date.now(),
          }
          store.write([task, ...store.tasks])

          setConfirm(null)
          setResult({
            ok: true,
            dir: plan.dir,
            text: started.text,
            started: started.delivery === 'agent',
            delivery: started.delivery,
            warning: started.warning,
            task,
          })
        } catch (error) {
          setResult({ error: '建立工作区失败：' + ((error && error.message) || String(error)) })
        }
        setLaunching(false)
      }, [confirm])

      const total = allChecks.length
      const ready = Boolean(dir.trim()) && selectedIds.length > 0

      const quickBtn = (label, which, title) => h(Button, {
        key: which, onClick: () => selectPreset(which), title,
        style: { padding: '5px 11px', fontSize: 12 },
      }, label)

      return h('div', null, [
        // ---- Step 1: directory ----
        h('div', { key: 'dir', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '1'),
            '选择原理图工程目录',
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '选择包含 PST 网表、原理图 PDF、器件数据手册、BOM、DRC 检查报告等的目录。'
            + 'Agent 会在该目录中查找文件，并先向你确认是否齐全。'),
          h('div', { key: 'r', style: S.row }, [
            h('input', {
              key: 'i', style: { ...S.inputMono, flex: 1, minWidth: 0 },
              spellCheck: false, value: dir,
              placeholder: '尚未选择目录',
              onChange: e => { setDir(e.target.value); setResult(null) },
            }),
            h(Button, { key: 'b', primary: true, disabled: pickBusy, onClick: pick },
              pickBusy ? '…' : '选择目录…'),
            dir.trim()
              ? h(Button, {
                  key: 'c',
                  onClick: () => {
                    setDir(''); setConfirm(null); setResult(null)
                  },
                  title: '清除', style: { padding: '8px 10px' },
                }, '×')
              : null,
          ]),
          pickError
            ? h('div', {
                key: 'pe', style: { marginTop: 9, fontSize: 12, color: T.err, lineHeight: 1.5 },
              }, pickError)
            : null,
          dir.trim()
            ? h('div', { key: 'ok', style: { marginTop: 9, fontSize: 12, color: T.text2 } }, [
                h('span', { key: 'b', style: S.badge('ok') }, '已选择'),
                h('span', { key: 'p', style: { ...S.path, marginLeft: 8 } }, dir.trim()),
              ])
            : null,

        ]),

        // ---- Step 2: checks by category ----
        h('div', { key: 'chk', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            h('span', { key: 'n', style: S.stepNum }, '2'),
            '勾选要审查的检查项',
            h('span', { key: 'b', style: S.badge('ok') },
              `已选 ${selectedIds.length} / ${total}`),
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '共 ' + total + ' 条，按类别分选项卡切换。每条标题下方是该项的检查重点；'
            + '标「可自动」的条目工具有现成规则，其余需 Agent 结合手册与原图取证判断。'),
          // Bulk controls
          h('div', {
            key: 'bulk',
            style: {
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
              paddingBottom: 12, marginBottom: 12,
              borderBottom: '1px solid ' + T.border1,
            },
          }, [
            h('span', { key: 'l', style: { ...S.label, marginBottom: 0 } }, '快捷选择'),
            quickBtn('全部 P0', 'p0', '只勾选优先级 P0 的检查项'),
            quickBtn('P0 + P1', 'p0p1', '勾选 P0 与 P1'),
            quickBtn('全部 ' + total + ' 条', 'all', '勾选全部检查项'),
            quickBtn('清空', 'none', '取消全部勾选'),
            h('span', {
              key: 'sep',
              style: { width: 1, height: 18, background: T.border1, margin: '0 2px' },
            }),
            h('span', { key: 'l2', style: { ...S.label, marginBottom: 0 } }, '优先级过滤'),
            h('select', {
              key: 'pf', style: { ...S.input, width: 'auto', cursor: 'pointer', padding: '5px 9px' },
              value: priorityFilter, onChange: e => setPriorityFilter(e.target.value),
            }, [
              h('option', { key: 'all', value: 'ALL' }, '全部优先级'),
              h('option', { key: 'p0', value: 'P0' }, '仅 P0'),
              h('option', { key: 'p1', value: 'P1' }, '仅 P1'),
              h('option', { key: 'p2', value: 'P2' }, '仅 P2'),
            ]),
          ]),

          // Category tabs, laid out horizontally and scrolled as one strip.
          h('div', {
            key: 'tabs',
            role: 'tablist',
            style: {
              display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10,
              marginBottom: 10, borderBottom: '1px solid ' + T.border1,
            },
          }, groups.map(g => {
            const on = g.category === active
            const picked = g.items.filter(i => checked[i.id]).length
            const count = g.items.filter(visible).length
            if (!count) return null
            return h('button', {
              key: g.category,
              type: 'button',
              role: 'tab',
              'aria-selected': String(on),
              onClick: () => setActiveCategory(g.category),
              style: S.catTab(on),
            }, [
              h('span', { key: 'n', style: { whiteSpace: 'nowrap' } }, g.label),
              h('span', {
                key: 'c',
                style: {
                  fontSize: 10.5, opacity: 0.75,
                  fontVariantNumeric: 'tabular-nums',
                },
              }, String(g.items.length)),
              picked
                ? h('span', {
                    key: 'p',
                    style: {
                      fontSize: 10, fontWeight: 700, padding: '0 5px',
                      borderRadius: 999, background: on ? '#fff' : T.brand,
                      color: on ? T.brand : '#fff',
                    },
                  }, String(picked))
                : null,
            ])
          })),

          // Selected category header + its checks
          (() => {
            const g = groups.find(x => x.category === active) || groups[0]
            if (!g) return null
            const shown = g.items.filter(visible)
            const picked = g.items.filter(i => checked[i.id]).length
            return h('div', { key: 'panel' }, [
              h('div', { key: 'bar', style: S.catBar }, [
                h('span', { key: 'n', style: S.catName }, g.label),
                h('span', { key: 'c', style: S.catCount }, `${g.items.length} 条`),
                picked
                  ? h('span', { key: 'p', style: S.badge('brand') }, `已选 ${picked}`)
                  : null,
                h('div', {
                  key: 'q',
                  style: { display: 'flex', gap: 6, marginLeft: 'auto' },
                }, [
                  h('button', {
                    key: 'all', type: 'button', style: S.miniBtn,
                    onClick: () => toggleGroup(g, true),
                  }, '全选本类'),
                  h('button', {
                    key: 'none', type: 'button', style: S.miniBtn,
                    onClick: () => toggleGroup(g, false),
                  }, '全不选'),
                ]),
              ]),
              shown.length
                ? h('div', { key: 'l', style: S.checkList }, shown.map(c =>
                    h('label', {
                      key: c.id,
                      style: S.checkRow(checked[c.id]),
                    }, [
                      h('input', {
                        key: 'i', type: 'checkbox', checked: Boolean(checked[c.id]),
                        onChange: () => toggleOne(c.id), style: S.check,
                      }),
                      h('div', { key: 'x', style: { flex: 1, minWidth: 0 } }, [
                        h('div', { key: 't', style: S.checkTop }, [
                          h('span', { key: 'id', style: S.checkId }, c.id),
                          h('span', { key: 't', style: S.checkTitle }, c.t),
                          c.i
                            ? h('span', { key: 'a', style: S.badge('ok') }, '可自动')
                            : null,
                          h('span', {
                            key: 'p',
                            style: S.priority(c.p),
                          }, c.p),
                        ]),
                        // One plain line: what this check actually looks at.
                        c.e
                          ? h('div', { key: 'e', style: S.checkMeta },
                              '检查重点：' + c.e)
                          : null,
                      ]),
                    ])))
                : h('div', {
                    key: 'e', style: { ...S.empty, padding: '24px 16px' },
                  }, '当前优先级过滤下没有条目。'),
            ])
          })(),
        ]),

        // ---- Step 3: start ----
        h('div', { key: 'go', style: { ...S.row, marginBottom: 14 } }, [
          h(Button, {
            key: 'b', primary: true, disabled: !ready || launching, onClick: askConfirm,
          }, '开始审查…'),
          !dir.trim()
            ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请先选择工程目录')
            : !selectedIds.length
              ? h('span', { key: 'n', style: { fontSize: 12, color: T.warn } }, '请至少勾选一条检查项')
              : h('span', { key: 'n', style: { fontSize: 12, color: T.text2 } },
                  `${selectedIds.length} 条检查项将在新会话中执行`),
        ]),

        // ---- Confirmation ----
        confirm ? h('div', {
          key: 'cf',
          style: { ...S.card, borderColor: T.brand, background: T.layer2 },
        }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '确认后执行',
            h('span', { key: 'b', style: S.badge('warn') }, '尚未建立任何东西'),
          ]),
          h('div', { key: 'd', style: S.cardHint },
            '点击确认后：把该目录注册为工作区、在其中新建会话，并把指令直接派给该会话的 Agent。'
            + 'Agent 会立即开始文件清点，不需要你再按回车。'),
          h('div', { key: 'dir', style: S.field }, [
            h('label', { key: 'l', style: S.label }, '工作区目录'),
            h('div', { key: 'p', style: S.path }, confirm.dir),
          ]),
          h('div', { key: 'sum', style: S.field }, [
            h('label', { key: 'l', style: S.label },
              `将审查的检查项（${confirm.chosen.length}）`),
            h('div', { key: 'l', style: { ...S.list, maxHeight: 170, overflowY: 'auto' } },
              confirm.chosen.map(c => h('div', { key: c.id, style: S.sumRow }, [
                h('span', { key: 'i', style: S.checkId }, c.id),
                h('span', { key: 't', style: S.checkTitle }, c.t),
              ]))),
          ]),
          h('div', { key: 'btn', style: { ...S.row, marginTop: 14 } }, [
            h(Button, { key: 'y', primary: true, disabled: launching, onClick: launch },
              launching ? '正在启动…' : '确认并启动 Agent'),
            h(Button, { key: 'n', disabled: launching, onClick: () => setConfirm(null) }, '取消'),
          ]),
        ]) : null,

        // ---- Result ----
        result && result.error
          ? h('div', { key: 'err', style: S.card }, [
              h('h3', { key: 't', style: S.cardTitle }, '未能建立工作区'),
              h('div', { key: 'e', style: { fontSize: 12.5, color: T.err, lineHeight: 1.5 } },
                result.error),
            ])
          : null,

        result && result.ok
          ? h('div', { key: 'okres', style: S.card }, [
              h('h3', { key: 't', style: S.cardTitle }, [
                result.started ? 'Agent 已启动' : '工作区已就绪',
                h('span', { key: 'b', style: S.badge(result.started ? 'ok' : 'warn') },
                  result.started ? '审查进行中' : '等待你按回车'),
              ]),
              h('div', { key: 'd', style: S.cardHint },
                result.started
                  ? '已在左侧打开该工作区的新会话，并把指令直接派给了会话的 Agent——'
                    + '它会立刻开始文件清点，不需要你再按回车。'
                  : result.delivery === 'draft'
                    ? '已在左侧打开该工作区的新会话，指令已填入输入框，需要你按回车才会开始。'
                      + (result.warning ? '（直接派发失败：' + result.warning + '）' : '')
                    : '工作区已建立。请到左侧打开它并新建会话，再把下面内容填入输入框后按回车。'),
              h('div', { key: 'ws', style: S.field }, [
                h('label', { key: 'l', style: S.label }, '工作区'),
                h('div', { key: 'p', style: S.path }, result.dir),
              ]),
              result.started ? null : h('div', { key: 'tx', style: { marginTop: 4 } }, [
                h('div', {
                  key: 'l',
                  style: {
                    ...S.label, display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                }, [
                  h('span', { key: 't' }, '指令内容'),
                  h(CopyButton, { key: 'c', text: result.text }),
                ]),
                h('pre', {
                  key: 'p',
                  style: { ...S.cmd, marginBottom: 0, maxHeight: 200, overflowY: 'auto' },
                }, result.text),
              ]),
            ])
          : null,
      ])
    }

    // ------------------------------------------------------------ Catalog tab

    // -------------------------------------------------------------- About tab

    function AboutTab() {
      const meta = (CATALOG && CATALOG.meta) || {}
      const all = (CATALOG && CATALOG.checks) || []
      const autoCount = all.filter(c => c.i).length
      const facts = [
        ['检查项总数', `${all.length}`],
        ['工具可自动判定', `${autoCount}`],
        ['需证据审查', `${all.length - autoCount}`],
        ['类别数', `${new Set(all.map(c => c.c)).size}`],
        ['目录版本', `${meta.catalogVersion || '—'}`],
      ]
      return h('div', null, [
        h('div', { key: 'a', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '这个插件做什么'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 14 } },
            '把 hw-review Skill 变成一个可操作的应用：'
            + '选目录 → 勾检查项 → 建工作区并驱动 Agent 审查，'
            + '任务在「任务管理」里被持续跟踪，进度直接读会话事件流。'),
          h('div', { key: 'g', style: S.statGrid }, facts.map(([k, v]) =>
            h('div', { key: k, style: S.stat }, [
              h('div', { key: 'k', style: S.statK }, k),
              h('div', { key: 'v', style: S.statV }, v),
            ]))),
        ]),
        h('div', { key: 'why', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '为什么只有少数检查项能自动判定'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            'hardwarecheck 从 DAT 网表中解析出结构事实（网络、引脚、连通性、候选电源轨）。'
            + '但 ' + all.length + ' 条检查项里只有 ' + autoCount + ' 条是纯结构问题，'
            + '看一眼网表就能对错。其余条目要判断「电压是否合适」「降额是否足够」'
            + '「保护是否到位」，必须结合数据手册标称值、设计需求和工程意图——'
            + '这需要 Agent 逐条取证，工具无法直接给结论。'),
        ]),
        h('div', { key: 'how', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '三步使用'),
          h('ol', { key: 'u', style: { ...S.ul, paddingLeft: 20 } }, [
            h('li', { key: '1' }, '「新建任务」：选择 PST 网表所在目录，'
              + '按类别勾选要审查的检查项（可一键全选 P0 或全部）。'),
            h('li', { key: '2' }, '点「开始审查」并确认：插件把该目录注册为工作区、'
              + '新建会话，并把审查指令直接派给该会话的 Agent——Agent 立即开始，无需按回车。'),
            h('li', { key: '3' }, '「任务管理」：每个任务实时显示审查进度，'
              + '可一键跳回它的会话。任务保存在浏览器本地，重启后仍在。'),
          ]),
        ]),
        h('div', { key: 'agent', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, 'Agent 会怎么做'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            '先按 Skill 的规范做文件清点并报告缺件，等你确认后再加载 '
            + 'hw-review Skill、按它规定的证据门槛与报告格式逐条审查。'
            + '插件只负责范围（哪些检查项）与跟踪，方法与判定标准来自 Skill。'),
        ]),
        h('div', { key: 'b', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '关于 python 命令'),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            'Agent 会调用 `python -m hardwarecheck ...`。默认用 PATH 中的 `python`；'
            + '若你的解释器是其他名字或虚拟环境，在会话里直接告诉 Agent 即可。'),
        ]),
        h('div', { key: 'c', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, '边界与免责'),
          h('ul', { key: 'u', style: S.ul }, [
            h('li', { key: '1' }, '面板负责建工作区、建会话、派发指令；真正执行由 Agent 承担，受其审批策略约束。'),
            h('li', { key: '2' }, '目录选择器只用于取路径；面板不读取、不解析你的工程文件。'),
            h('li', { key: '3' }, '勾选不等于检查通过；条目是覆盖目标，不是已执行的检查。'),
            h('li', { key: '4' }, '结构规则结论不等同于电气正确；仍需原图 ERC、手册核实与人工签核。'),
            h('li', { key: '5' }, 'PCB 布局、布线、叠层与 EMC 物理检查不在本工具范围内。'),
            h('li', { key: '6' }, '清单快照为构建时数据，工具仓库更新后需重新生成。'),
          ]),
        ]),
      ])
    }

    // ------------------------------------------------------------------ Panel

    function WorkbenchPanel() {
      const [tab, setTab] = useState('design')
      const store = useTaskStore()
      const running = store.tasks.length

      /** Open a task's Session and show it. */
      const openTask = useCallback(task => {
        const ctx = ctxRef.current
        const ui = ctx && ctx.get ? ctx.get('uiWorkspace') : undefined
        if (ui && typeof ui.openSession === 'function' && task.sessionId) {
          try { ui.openSession(task.sessionId); return } catch { /* fall through */ }
        }
        if (ui && typeof ui.connectWorkspace === 'function' && task.workspaceId) {
          ui.connectWorkspace(task.workspaceId).catch(() => {})
        }
      }, [])

      const tabs = [
        { id: 'design', label: '新建任务' },
        { id: 'tasks', label: '任务管理', count: running },
        { id: 'about', label: '说明' },
      ]

      return h('div', { style: S.root }, [
        h('div', { key: 'h', style: S.header }, [
          h('div', { key: 'r', style: S.headerRow }, [
            h('h1', { key: 't', style: S.h1 }, '原理图审查'),
            h('span', { key: 's', style: S.sub },
              running ? `${running} 个任务跟踪中` : 'hardwarecheck 工作台'),
          ]),
          h('div', { key: 'tb', style: S.tabRow, role: 'tablist' }, tabs.map(t =>
            h('button', {
              key: t.id, type: 'button', role: 'tab',
              'aria-selected': String(tab === t.id),
              onClick: () => setTab(t.id),
              style: S.tab(tab === t.id),
            }, [
              t.label,
              t.count
                ? h('span', {
                    key: 'c',
                    style: {
                      marginLeft: 6, padding: '0 6px', borderRadius: 999,
                      background: T.brand, color: '#fff', fontSize: 10,
                      fontWeight: 700, verticalAlign: 'middle',
                    },
                  }, String(t.count))
                : null,
            ]))),
        ]),
        h('div', { key: 'b', style: S.body }, [
          tab === 'design'
            ? h(DesignTab, { key: 'd', store, onOpenTask: openTask })
            : tab === 'tasks'
              ? h(TasksTab, { key: 't', store, onOpen: openTask })
              : h(AboutTab, { key: 'a' }),
        ]),
      ])
    }

    /** Sidebar rail icon: a lens over a schematic net. */
    function PanelIcon(props) {
      const size = (props && props.size) || 20
      return h('svg', {
        viewBox: '0 0 64 64', width: size, height: size,
        fill: 'none', 'aria-hidden': true, style: { display: 'block' },
      }, [
        h('path', {
          key: 'net', d: 'M12 22 H22 V34 H34 M18 40 H26 V28 H40',
          stroke: 'currentColor', strokeWidth: 5,
          strokeLinecap: 'round', opacity: 0.75,
        }),
        h('circle', {
          key: 'ring', cx: 27, cy: 27, r: 15,
          stroke: 'currentColor', strokeWidth: 5,
        }),
        h('line', {
          key: 'handle', x1: 38, y1: 38, x2: 52, y2: 52,
          stroke: 'currentColor', strokeWidth: 7, strokeLinecap: 'round',
        }),
      ])
    }

    /**
     * Read one session's event window and decide whether it is a hardware
     * review, and how far it has progressed.
     *
     * Detection is deliberately conservative: the session must show
     * hardwarecheck activity AND a check-id pattern, so an ordinary
     * conversation never renders the bar.
     */
    /**
     * Read one session's event window and report progress for a task.
     *
     * Progress is measured only against the ids the task actually asked for:
     * scanning for every check-like token in the transcript would count ids the
     * agent merely mentions, and the denominator must never come from prose.
     *
     * A check counts as reported once it appears in text the assistant wrote
     * *after* the work started, so the instruction itself does not count.
     */
    function summarize(entries, wanted) {
      const want = Array.isArray(wanted) ? wanted : []
      const wantSet = new Set(want)
      if (!wantSet.size) return { detected: false }

      let running = false
      let calls = 0
      const reported = new Set()

      // The instruction is the first user message; only text after it counts as
      // a result. Gating on a tool call was wrong: the id list lives in the
      // prompt, not in a tool argument, so that gate never opened.
      let seenInstruction = false

      for (const entry of entries) {
        if (!entry || entry.type !== 'event' || !entry.event) continue
        const event = entry.event
        const d = event.data || {}

        if (event.type === 'turn/start' || event.type === 'step/start') running = true
        if (event.type === 'turn/end') running = false

        if (event.type === 'user/message') {
          // The launch prompt is the one carrying our id list.
          let body = ''
          try {
            const blocks = (d.message && d.message.content) || d.content || []
            for (const b of blocks) if (b && b.type === 'text' && b.text) body += b.text
          } catch { /* ignore */ }
          if (!body) body = JSON.stringify(d)
          if (body.indexOf('审查范围') !== -1 || body.indexOf('检查项') !== -1) {
            seenInstruction = true
          }
          continue
        }

        if (event.type === 'tool/call') {
          const name = String(d.name || '')
          if (name === 'bash' || name === 'pwsh' || name === 'ops_bash'
            || name === 'terminal_open') calls++
          continue
        }

        if (event.type === 'assistant/message') {
          // Without a captured instruction, still count matches — a missing
          // prompt marker must not freeze the bar at zero.
          const msg = d.message || {}
          const blocks = Array.isArray(msg.content) ? msg.content : []
          for (const block of blocks) {
            if (!block || block.type !== 'text' || !block.text) continue
            for (const m of String(block.text).matchAll(/\b([A-Z]{2,10}X?-[0-9]{2})\b/g)) {
              if (wantSet.has(m[1])) reported.add(m[1])
            }
          }
        }
      }

      const total = want.length
      const done = reported.size
      return {
        detected: true,
        done,
        total,
        calls,
        complete: done >= total,
        phase: running ? 'working' : done >= total ? 'done' : 'idle',
        instructionSeen: seenInstruction,
      }
    }

    /**
     * Follow the review session started by this panel.
     *
     * `workspaces.create` returns the Workspace's session ids, and
     * `sessions.retain` subscribes to one from any scope, so the panel can show
     * live progress without living inside the conversation.
     */
    function useReviewProgress(sessionId, wanted) {
      const [state, setState] = useState(null)

      // Join ids so the effect re-runs only when the set actually changes.
      const key = Array.isArray(wanted) ? wanted.join(',') : ''

      React.useEffect(() => {
        if (!sessionId) { setState(null); return undefined }
        const ctx = ctxRef.current
        const sessions = ctx && ctx.get ? ctx.get('sessions') : undefined
        if (!sessions || typeof sessions.retain !== 'function') return undefined

        let ref
        let unsub
        let cancelled = false
        try {
          ref = sessions.retain(sessionId, { source: 'controllerOperation' })
        } catch {
          return undefined
        }

        const read = () => {
          try {
            const binding = ref.binding
            if (!binding || !binding.eventSource) return
            const window = binding.eventSource.getSnapshot()
            if (window && window.entries) {
              setState(summarize(window.entries, key ? key.split(',') : []))
            }
          } catch {
            /* a partially opened session simply shows nothing yet */
          }
        }

        // The reference opens history asynchronously; subscribe once ready.
        Promise.resolve(ref.ready).then(() => {
          if (cancelled) return
          try {
            unsub = ref.binding.eventSource.subscribe(read)
            read()
          } catch { /* ignore */ }
        }).catch(() => { /* ignore */ })

        return () => {
          cancelled = true
          try { if (unsub) unsub() } catch { /* ignore */ }
          try { if (ref && typeof ref.release === 'function') ref.release() } catch { /* ignore */ }
        }
      }, [sessionId, key])

      return state
    }

    /**
     * One task row: what was started, and how far it has got.
     *
     * The session is retained per row so each task tracks its own review.
     */
    function TaskRow({ task, onOpen, onSelect, onRemove }) {
      const state = useReviewProgress(task.sessionId, task.ids)

      const pct = state && state.detected
        ? Math.round((state.done / Math.max(1, state.total)) * 100)
        : 0

      // 'done' requires every requested id to have been reported, which is the
      // only completion signal we can honestly derive.
      const tone = !state || !state.detected ? undefined
        : state.phase === 'done' ? 'ok'
        : state.phase === 'working' ? 'brand'
        : undefined

      return h('div', {
        style: { ...S.item, cursor: 'pointer' },
        onClick: onSelect,
      }, [
        h('div', { key: 't', style: S.itemTop }, [
          h('div', { key: 'l', style: { minWidth: 0, flex: 1 } }, [
            h('div', { key: 'p', style: S.path }, task.dir),
            h('div', { key: 'm', style: { fontSize: 11, color: T.text2, marginTop: 3 } },
              `${task.ids.length} 条检查项 · ${new Date(task.createdAt).toLocaleString()}`),
          ]),
          h('span', { key: 'b', style: S.badge(tone) },
            !state || !state.detected ? '等待中'
              : state.phase === 'done' ? '已完成'
              : state.phase === 'working' ? '进行中'
              : state.phase === 'starting' ? '已启动'
              : '进行中'),
        ]),

        state && state.detected
          ? h('div', { key: 'p', style: { marginTop: 9 } }, [
              h('div', {
                key: 'bar',
                style: {
                  height: 5, borderRadius: 999, background: T.border1,
                  overflow: 'hidden', marginBottom: 5,
                },
              }, h('div', {
                style: {
                  width: pct + '%', height: '100%',
                  background: tone === 'ok' ? T.ok : T.brand, transition: 'width .3s',
                },
              })),
              h('div', { key: 'n', style: { fontSize: 11, color: T.text2 } },
                `检查项 ${state.done} / ${state.total} 已报告`
                + (state.complete ? ' · 全部已出结论' : '')
                + (state.calls ? ` · 命令 ${state.calls} 次` : '')),
            ])
          : h('div', { key: 'n', style: { fontSize: 11, color: T.text2, marginTop: 7 } },
              '尚未在该会话中检测到审查活动'),

        h('div', { key: 'a', style: { ...S.row, marginTop: 10 } }, [
          h('span', {
            key: 'w', style: { display: 'contents' },
            onClick: ev => ev.stopPropagation(),
          }, [
            h(Button, { key: 'o', onClick: () => onOpen(task) }, '打开会话'),
            h(Button, { key: 'd', onClick: onSelect }, '详情'),
            h(Button, {
              key: 'r', onClick: () => onRemove(task), style: { padding: '8px 10px' },
            }, '移除'),
          ]),
        ]),
      ])
    }

    /** Detail route: reads progress for the selected task, then renders it. */
    function TaskDetailRoute({ task, onBack, onOpen, onRemove }) {
      const state = useReviewProgress(task.sessionId, task.ids)
      return h(TaskDetail, { task, state, onBack, onOpen, onRemove })
    }

    /**
     * Full detail for one task: exactly what was asked for at launch time.
     *
     * The stored record is the only durable copy of the request, so this view
     * is the way back to the original scope after a restart.
     */
    function TaskDetail({ task, state, onBack, onOpen, onRemove }) {
      const all = (CATALOG && CATALOG.checks) || []
      const byId = {}
      for (const c of all) byId[c.id] = c
      const ids = Array.isArray(task.ids) ? task.ids : []

      const groups = []
      const seen = {}
      for (const id of ids) {
        const c = byId[id]
        const cat = c ? c.c : 'OTHER'
        if (!seen[cat]) { seen[cat] = []; groups.push(cat) }
        seen[cat].push(id)
      }

      const pct = state && state.detected
        ? Math.round((state.done / Math.max(1, state.total)) * 100)
        : 0

      return h('div', null, [
        h('div', { key: 'back', style: { marginBottom: 12 } },
          h(Button, { onClick: onBack }, '← 返回任务列表')),

        h('div', { key: 'a', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '任务详情',
            state && state.detected
              ? h('span', {
                  key: 'b',
                  style: S.badge(state.complete ? 'ok'
                    : state.phase === 'working' ? 'brand' : undefined),
                }, state.complete ? '已完成'
                  : state.phase === 'working' ? '进行中' : '进行中')
              : h('span', { key: 'b', style: S.badge() }, '等待中'),
          ]),
          h('div', { key: 'rows', style: { display: 'flex', flexDirection: 'column', gap: 9 } }, [
            h('div', { key: 'dir' }, [
              h('div', { key: 'l', style: S.label }, '工程目录'),
              h('div', { key: 'v', style: S.path }, task.dir),
            ]),
            h('div', { key: 'time' }, [
              h('div', { key: 'l', style: S.label }, '创建时间'),
              h('div', { key: 'v', style: { fontSize: 12.5 } },
                new Date(task.createdAt).toLocaleString()),
            ]),
            h('div', { key: 'count' }, [
              h('div', { key: 'l', style: S.label }, '进度'),
              h('div', { key: 'v', style: { fontSize: 12.5 } },
                state && state.detected
                  ? `已报告 ${state.done} / ${state.total} 条（${pct}%）`
                  : `共 ${ids.length} 条，尚未检测到审查活动`),
            ]),
            state && state.detected && state.calls
              ? h('div', { key: 'calls' }, [
                  h('div', { key: 'l', style: S.label }, '命令调用'),
                  h('div', { key: 'v', style: { fontSize: 12.5 } }, `${state.calls} 次`),
                ])
              : null,
          ]),
        ]),

        h('div', { key: 'b', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, `勾选的检查项（${ids.length}）`),
          h('div', { key: 'd', style: S.cardHint },
            '这是任务创建时确定的审查范围，之后不随会话变化。'),
          ...groups.map(cat => h('div', {
            key: cat, style: { marginBottom: 10 },
          }, [
            h('div', {
              key: 'h',
              style: { fontSize: 12, fontWeight: 600, marginBottom: 5, color: T.text2 },
            }, CATEGORY_LABEL[cat] || cat),
            h('div', { key: 'l', style: S.checkList }, seen[cat].map(id => {
              const c = byId[id]
              return h('div', {
                key: id,
                style: {
                  display: 'flex', alignItems: 'baseline', gap: 8,
                  padding: '7px 11px', borderTop: '1px solid ' + T.border1,
                },
              }, [
                h('span', { key: 'i', style: S.checkId }, id),
                h('span', {
                  key: 't', style: { ...S.checkTitle, flex: 1, minWidth: 0 },
                }, c ? c.t : '（清单中无此条目）'),
                c ? h('span', { key: 'p', style: S.priority(c.p) }, c.p) : null,
              ])
            })),
          ])),
        ]),

        h('div', { key: 'c', style: { ...S.row, marginBottom: 14 } }, [
          h(Button, { key: 'o', primary: true, onClick: () => onOpen(task) }, '打开会话'),
          h(Button, { key: 'r', onClick: () => onRemove(task) }, '删除此任务'),
        ]),
      ])
    }

    /** The task list: everything this panel has started. */
    function TasksTab({ store, onOpen }) {
      const [selected, setSelected] = useState(null)
      const tasks = store.tasks

      const current = selected ? tasks.find(t => t.id === selected) : null
      if (current) {
        return h(TaskDetailRoute, {
          task: current,
          onBack: () => setSelected(null),
          onOpen,
          onRemove: task => {
            store.write(tasks.filter(x => x.id !== task.id))
            setSelected(null)
          },
        })
      }

      if (!tasks.length) {
        return h('div', { style: S.empty }, [
          h('div', { key: 'a' }, '还没有审查任务。'),
          h('div', { key: 'b', style: { marginTop: 8, fontSize: 12 } },
            '在「设计输入」里选择目录、勾选检查项并开始审查，任务会出现在这里。'),
        ])
      }
      return h('div', null, [
        h('div', { key: 'h', style: S.card }, [
          h('h3', { key: 't', style: S.cardTitle }, [
            '审查任务',
            h('span', { key: 'b', style: S.badge('ok') }, `${tasks.length} 个`),
          ]),
          h('div', { key: 'd', style: { ...S.cardHint, marginBottom: 0 } },
            '每个任务跟踪它在会话中的实际进度。进度来自会话事件流，不是估算。'),
        ]),
        ...tasks.map(t => h(TaskRow, {
          key: t.id, task: t, onOpen,
          onSelect: () => setSelected(t.id),
          onRemove: task => store.write(store.tasks.filter(x => x.id !== task.id)),
        })),
      ])
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        // Expose services to slot components, which receive no context.
        ctxRef.current = ctx

        // Sidebar entry: the list id doubles as the main-panel key.
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register({
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 30,
            label: '原理图审查',
          }, PanelIcon))

        // Matching central panel, dispatched by the sidebar entry id.
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID },
            () => h(WorkbenchPanel)))

      },
    }
  },
})
