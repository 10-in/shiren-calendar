# 日历算法

## 时间支持范围

公元前1000～公元3000年

## 农历转阳历
```js
console.log(solar2lunar(2021, 11, 11)) // [2021,10,7,false]

```
## 阳历转农历
```js
console.log(lunar2solar(2021, 10, 7)) // [2021,11,11]
```

## 阳历月份有多少天
```js
console.log(solarMonthHasDays(2021, 11)) // 30
```

## 农历月份有多少天
```js
console.log(lunarMonthHasDays(2020, 4)) // 30
console.log(lunarMonthHasDays(2020, 4, true)) // 润4月 29
```

## 八字干支
```js
console.log(gzi(2021, 11, 11, 15))
// {
//     g: [ 7, 5, 9, 6 ], // 天干
//     z: [ 1, 11, 11, 8 ], // 地址
//     jd: 2459530.125011574, // 输入日期对应的儒略历时间
//     jq: [ 2459526.0404064553, 2459555.747754251 ], // 输入日期对应的前后节气(12节气，不包含中气)
//     jqi: 10 // 对应节气的索引 0 ~ 15 (详情参考gzi方法实现)
// }
```
> 如果需要区分早晚子时，调用时加入相应参数即可`gzi(2021, 11, 11, 15，0, 0, true)`

```js
console.log(plate(true,2000, 1, 1, 11)) // 未区分早晚子时
// {
//   basic: { g: [ 5, 2, 4, 4 ], z: [ 3, 0, 6, 6 ] }, // 四柱天干地址
//   lucky: { // 大运
//     desc: '8年2月6天起运',
//     g: [ // 大运天干
//       1, 0, 9, 8, 7,
//       6, 5, 4, 3, 2,
//       1, 0
//     ],
//     z: [ // 大运地支
//       11, 10, 9, 8, 7,
//        6,  5, 4, 3, 2,
//        1,  0
//     ],
//     datetime: [ // 每个大运对应的起运时间
//       '2008-01-25 11:49:00',
//       '2017-12-03 11:49:00',
//       '2027-10-12 11:49:00',
//       '2037-08-20 11:49:00',
//       '2047-06-29 11:49:00',
//       '2057-05-07 11:49:00',
//       '2067-03-16 11:49:00',
//       '2077-01-22 11:49:00',
//       '2086-12-01 11:49:00',
//       '2096-10-09 11:49:00',
//       '2106-08-19 11:49:00',
//       '2116-06-27 11:49:00'
//     ]
//   },
//   birth: { // 输入日期对应的前后节气名称及时间
//     front: { name: '大雪', time: '1999-12-07 21:47:36' },
//     back: { name: '小寒', time: '2000-01-06 09:01:02' }
//   }
// }

```
