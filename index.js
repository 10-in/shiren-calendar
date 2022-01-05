"use strict";

// 朔望月平均时长(mean length of synodic month)
const synMonth = 29.530588853;

// 因子
const ptsA = [485, 203, 199, 182, 156, 136, 77, 74, 70, 58, 52, 50, 45, 44, 29, 18, 17, 16, 14, 12, 12, 12, 9, 8];
const ptsB = [324.96, 337.23, 342.08, 27.85, 73.14, 171.52, 222.54, 296.72, 243.58, 119.81, 297.17, 21.02, 247.54, 325.15, 60.93, 155.12, 288.79, 198.04, 199.76, 95.39, 287.11, 320.81, 227.73, 15.45];
const ptsC = [1934.136, 32964.467, 20.186, 445267.112, 45036.886, 22518.443, 65928.934, 3034.906, 9037.513, 33718.147, 150.678, 2281.226, 29929.562, 31555.956, 4443.417, 67555.328, 4562.452, 62894.029, 31436.921, 14577.848, 31931.756, 34777.259, 1222.114, 16859.074];

// 检查1582年
function check1582(year, month, day) {
    return year === 1582 && month === 10 && day >= 5 && day < 15
}
function timeIsOk(hour, minute, second) {
    return 0 <= hour && hour <= 24 && 0 <= minute && minute <= 60 && 0 <= second && second <= 60
}
function dateIsOk(year, month, day) {
    if (year < -1000 || year > 3000 || month < 1 || month > 12 || check1582(year, month, day)) {
        return false;
    }
    const ndf1 = -(year % 4 === 0);
    const ndf2 = ((year % 400 === 0) - (year % 100 === 0)) && (year > 1582);
    const ndf = ndf1 + ndf2;
    const dom = 30 + ((Math.abs(month - 7.5) + 0.5) % 2) - (month === 2) * (2 + ndf);
    return 0 < day && day <= dom
}

/**
 * 将公历时间转换为儒略日历时间
 * @return boolean|number
 * @param year
 * @param month
 * @param day
 * @param hour
 * @param minute
 * @param second
 */
export function solar2julian(year, month, day, hour = 0, minute = 0, second = 0) {
    if (!(dateIsOk(year, month, day) && timeIsOk(hour, minute, second))) {
        return false;
    }
    const yp = year + Math.floor((month - 3) / 10);
    let yearJD;
    let init;
    if ((year > 1582) || (year === 1582 && month > 10) || (year === 1582 && month === 10 && day >= 15)) { //这一年有十天是不存在的
        init = 1721119.5;
        yearJD = Math.floor(yp * 365.25) - Math.floor(yp / 100) + Math.floor(yp / 400);
    } else if ((year < 1582) || (year === 1582 && month < 10) || (year === 1582 && month === 10 && day <= 4)) {
        init = 1721117.5;
        yearJD = Math.floor(yp * 365.25);
    } else {
        return false
    }
    const mp = Math.floor(month + 9) % 12;
    const monthJD = mp * 30 + Math.floor((mp + 1) * 34 / 57);
    const dayJD = day - 1;
    const hourJd = (hour + (minute + (second / 60)) / 60) / 24;
    return yearJD + monthJD + dayJD + hourJd + init;
}

/**
 * 将儒略日历时间转换为公历(格里高利历)时间
 * @param jd
 * @return array(年,月,日,时,分,秒)
 */
export function julian2solar(jd) {
    jd = Number(jd);
    let init, y4h;
    if (jd >= 2299160.5) {
        y4h = 146097;
        init = 1721119.5;
    } else {
        y4h = 146100;
        init = 1721117.5;
    }
    const jdr = Math.floor(jd - init);
    const yh = y4h / 4;
    const cen = Math.floor((jdr + 0.75) / yh);
    let d = Math.floor(jdr + 0.75 - cen * yh);
    const ywl = 1461 / 4;
    const jy = Math.floor((d + 0.75) / ywl);
    d = Math.floor(d + 0.75 - ywl * jy + 1);
    const ml = 153 / 5;
    const mp = Math.floor((d - 0.5) / ml);
    d = Math.floor((d - 0.5) - 30.6 * mp + 1);
    let y = (100 * cen) + jy;
    const m = (mp + 2) % 12 + 1;
    if (m < 3) {
        y = y + 1;
    }
    const sd = Math.floor((jd + 0.5 - Math.floor(jd + 0.5)) * 24 * 60 * 60 + 0.00005);
    let mt = Math.floor(sd / 60);
    const ss = sd % 60;
    const hh = Math.floor(mt / 60);
    mt = mt % 60;
    const yy = Math.floor(y);
    const mm = Math.floor(m);
    const dd = Math.floor(d);

    return [yy, mm, dd, hh, mt, ss];
}

/**
 * 对于指定日期时刻所属的朔望月,求出其均值新月点的月序数
 * @param jd
 * @return (number|number)[]
 */
export function meanNewMoon(jd) {
    const kn = Math.floor((jd - 2451550.09765) / synMonth);
    const jdt = 2451550.09765 + kn * synMonth;
    const t = (jdt - 2451545) / 36525;
    const theJD = jdt + 0.0001337 * t * t - 0.00000015 * t * t * t + 0.00000000073 * t * t * t * t;
    return [kn, theJD];
}

/**
 * 获取指定年的春分开始的24节气,另外多取2个确保覆盖完一个公历年
 * 大致原理是:先用此方法得到理论值,再用摄动值(Perturbation)和固定参数DeltaT做调整
 * @return *[]
 * @param year
 */
export function meanJQJD(year) {
    let i;
    const jd = VE(year);
    if (!jd) { return []; } //该年的春分点
    const ty = VE(year + 1) - jd; //该年的回归年長

    const num = 26;

    const ath = 2 * Math.PI / 24;
    const tx = (jd - 2451545) / 365250;
    const e = 0.0167086342 - 0.0004203654 * tx - 0.0000126734 * tx * tx + 0.0000001444 * tx * tx * tx - 0.0000000002 * tx * tx * tx * tx + 0.0000000003 * tx * tx * tx * tx * tx;
    const tt = year / 1000;
    const vp = 111.25586939 - 17.0119934518333 * tt - 0.044091890166673 * tt * tt - 4.37356166661345E-04 * tt * tt * tt + 8.16716666602386E-06 * tt * tt * tt * tt;
    const rvp = vp * 2 * Math.PI / 360;
    const peri = [];
    for (i = 0; i < num; i++) {
        let flag = 0;
        let th = ath * i + rvp;
        if (Math.PI < th && th <= 3 * Math.PI) {
            th = 2 * Math.PI - th;
            flag = 1;
        } else if (3 * Math.PI < th) {
            th = 4 * Math.PI - th;
            flag = 2;
        }
        const f1 = 2 * Math.atan((Math.sqrt((1 - e) / (1 + e)) * Math.tan(th / 2)));
        const f2 = (e * Math.sqrt(1 - e * e) * Math.sin(th)) / (1 + e * Math.cos(th));
        let f = (f1 - f2) * ty / 2 / Math.PI;
        if (flag === 1) {
            f = ty - f;
        } else if (flag === 2) {
            f = 2 * ty - f;
        }
        peri[i] = f;
    }
    const JDs = [];
    for (i = 0; i < num; i++) {
        JDs[i] = jd + peri[i] - peri[0];
    }

    return JDs;
}

/**
 * 求出实际新月点
 * 以2000年初的第一个均值新月点为0点求出的均值新月点和其朔望月之序数 k 代入此副程式來求算实际新月点
 * @param k
 * @return number
 */
export function trueNewMoon(k) {
    const jdt = 2451550.09765 + k * synMonth;
    const t = (jdt - 2451545) / 36525;
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const pt = jdt + 0.0001337 * t2 - 0.00000015 * t3 + 0.00000000073 * t4;
    const m = 2.5534 + 29.10535669 * k - 0.0000218 * t2 - 0.00000011 * t3;
    const mprime = 201.5643 + 385.81693528 * k + 0.0107438 * t2 + 0.00001239 * t3 - 0.000000058 * t4;
    const f = 160.7108 + 390.67050274 * k - 0.0016341 * t2 - 0.00000227 * t3 + 0.000000011 * t4;
    const omega = 124.7746 - 1.5637558 * k + 0.0020691 * t2 + 0.00000215 * t3;
    const es = 1 - 0.002516 * t - 0.0000074 * t2;
    const pi180 = Math.PI / 180
    let apt1 = -0.4072 * Math.sin(pi180 * mprime);
    apt1 += 0.17241 * es * Math.sin(pi180 * m);
    apt1 += 0.01608 * Math.sin(pi180 * 2 * mprime);
    apt1 += 0.01039 * Math.sin(pi180 * 2 * f);
    apt1 += 0.00739 * es * Math.sin(pi180 * (mprime - m));
    apt1 -= 0.00514 * es * Math.sin(pi180 * (mprime + m));
    apt1 += 0.00208 * es * es * Math.sin(pi180 * (2 * m));
    apt1 -= 0.00111 * Math.sin(pi180 * (mprime - 2 * f));
    apt1 -= 0.00057 * Math.sin(pi180 * (mprime + 2 * f));
    apt1 += 0.00056 * es * Math.sin(pi180 * (2 * mprime + m));
    apt1 -= 0.00042 * Math.sin(pi180 * 3 * mprime);
    apt1 += 0.00042 * es * Math.sin(pi180 * (m + 2 * f));
    apt1 += 0.00038 * es * Math.sin(pi180 * (m - 2 * f));
    apt1 -= 0.00024 * es * Math.sin(pi180 * (2 * mprime - m));
    apt1 -= 0.00017 * Math.sin(pi180 * omega);
    apt1 -= 0.00007 * Math.sin(pi180 * (mprime + 2 * m));
    apt1 += 0.00004 * Math.sin(pi180 * (2 * mprime - 2 * f));
    apt1 += 0.00004 * Math.sin(pi180 * (3 * m));
    apt1 += 0.00003 * Math.sin(pi180 * (mprime + m - 2 * f));
    apt1 += 0.00003 * Math.sin(pi180 * (2 * mprime + 2 * f));
    apt1 -= 0.00003 * Math.sin(pi180 * (mprime + m + 2 * f));
    apt1 += 0.00003 * Math.sin(pi180 * (mprime - m + 2 * f));
    apt1 -= 0.00002 * Math.sin(pi180 * (mprime - m - 2 * f));
    apt1 -= 0.00002 * Math.sin(pi180 * (3 * mprime + m));
    apt1 += 0.00002 * Math.sin(pi180 * (4 * mprime));

    let apt2 = 0.000325 * Math.sin(pi180 * (299.77 + 0.107408 * k - 0.009173 * t2));
    apt2 += 0.000165 * Math.sin(pi180 * (251.88 + 0.016321 * k));
    apt2 += 0.000164 * Math.sin(pi180 * (251.83 + 26.651886 * k));
    apt2 += 0.000126 * Math.sin(pi180 * (349.42 + 36.412478 * k));
    apt2 += 0.00011 * Math.sin(pi180 * (84.66 + 18.206239 * k));
    apt2 += 0.000062 * Math.sin(pi180 * (141.74 + 53.303771 * k));
    apt2 += 0.00006 * Math.sin(pi180 * (207.14 + 2.453732 * k));
    apt2 += 0.000056 * Math.sin(pi180 * (154.84 + 7.30686 * k));
    apt2 += 0.000047 * Math.sin(pi180 * (34.52 + 27.261239 * k));
    apt2 += 0.000042 * Math.sin(pi180 * (207.19 + 0.121824 * k));
    apt2 += 0.00004 * Math.sin(pi180 * (291.34 + 1.844379 * k));
    apt2 += 0.000037 * Math.sin(pi180 * (161.72 + 24.198154 * k));
    apt2 += 0.000035 * Math.sin(pi180 * (239.56 + 25.513099 * k));
    apt2 += 0.000023 * Math.sin(pi180 * (331.55 + 3.592518 * k));
    return pt + apt1 + apt2;
}

/**
 * 求∆t
 * @return number
 * @param yy
 * @param mm
 */
export function DeltaT(yy, mm) {
    let u, t, dt;
    const y = yy + (mm - 0.5) / 12;

    if (y <= -500) {
        u = (y - 1820) / 100;
        dt = (-20 + 32 * u * u);
    } else {
        if (y < 500) {
            u = y / 100;
            dt = (10583.6 - 1014.41 * u + 33.78311 * u * u - 5.952053 * u * u * u - 0.1798452 * u * u * u * u + 0.022174192 * u * u * u * u * u + 0.0090316521 * u * u * u * u * u * u);
        } else {
            if (y < 1600) {
                u = (y - 1000) / 100;
                dt = (1574.2 - 556.01 * u + 71.23472 * u * u + 0.319781 * u * u * u - 0.8503463 * u * u * u * u - 0.005050998 * u * u * u * u * u + 0.0083572073 * u * u * u * u * u * u);
            } else {
                if (y < 1700) {
                    t = y - 1600;
                    dt = (120 - 0.9808 * t - 0.01532 * t * t + t * t * t / 7129);
                } else {
                    if (y < 1800) {
                        t = y - 1700;
                        dt = (8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t * t * t - t * t * t * t / 1174000);
                    } else {
                        if (y < 1860) {
                            t = y - 1800;
                            dt = (13.72 - 0.332447 * t + 0.0068612 * t * t + 0.0041116 * t * t * t - 0.00037436 * t * t * t * t + 0.0000121272 * t * t * t * t * t - 0.0000001699 * t * t * t * t * t * t + 0.000000000875 * t * t * t * t * t * t * t);
                        } else {
                            if (y < 1900) {
                                t = y - 1860;
                                dt = (7.62 + 0.5737 * t - 0.251754 * t * t + 0.01680668 * t * t * t - 0.0004473624 * t * t * t * t + t * t * t * t * t / 233174);
                            } else {
                                if (y < 1920) {
                                    t = y - 1900;
                                    dt = (-2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t * t * t - 0.000197 * t * t * t * t);
                                } else {
                                    if (y < 1941) {
                                        t = y - 1920;
                                        dt = (21.2 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * t * t * t);
                                    } else {
                                        if (y < 1961) {
                                            t = y - 1950;
                                            dt = (29.07 + 0.407 * t - t * t / 233 + t * t * t / 2547);
                                        } else {
                                            if (y < 1986) {
                                                t = y - 1975;
                                                dt = (45.45 + 1.067 * t - t * t / 260 - t * t * t / 718);
                                            } else {
                                                if (y < 2005) {
                                                    t = y - 2000;
                                                    dt = (63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t * t * t + 0.000651814 * t * t * t * t + 0.00002373599 * t * t * t * t * t);
                                                } else {
                                                    if (y < 2050) {
                                                        t = y - 2000;
                                                        dt = (62.92 + 0.32217 * t + 0.005589 * t * t);
                                                    } else {
                                                        if (y < 2150) {
                                                            u = (y - 1820) / 100;
                                                            dt = (-20 + 32 * u * u - 0.5628 * (2150 - y));
                                                        } else {
                                                            u = (y - 1820) / 100;
                                                            dt = (-20 + 32 * u * u);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (y < 1955 || y >= 2005) {
        dt = dt - (0.000012932 * (y - 1955) * (y - 1955));
    }
    return dt / 60;
}

/**
 * 获取某年的立春
 * @param year
 * @returns {*}
 */
export function spring(year) {
    return adjustedJQ(year - 1, 21, 21)[21]
}

/**
 * 计算指定年(公历)的春分点(vernal equinox),但因地球在绕日运行时会因受到其他星球之影响而产生摄动(perturbation),必须将此现象产生的偏移量加入.
 * @return boolean|number 返回儒略日历格林威治时间
 * @param year
 */
export function VE(year) {
    let m;
    if (year < -8000 && 8001 < year) {
        return false;
    }
    if (1000 <= year && year <= 8001) {
        m = (year - 2000) / 1000;
        return 2451623.80984 + 365242.37404 * m + 0.05169 * m * m - 0.00411 * m * m * m - 0.00057 * m * m * m * m;
    } else {
        m = year / 1000;
        return 1721139.29189 + 365242.1374 * m + 0.06134 * m * m + 0.00111 * m * m * m - 0.00071 * m * m * m * m;
    }
}

/**
 * 地球在绕日运行时會因受到其他星球之影响而產生摄动(perturbation)
 * @return number 返回某时刻(儒略日历)的摄动偏移量
 * @param jd
 */
export function perturbation(jd) {
    const t = (jd - 2451545) / 36525;
    let s = 0;
    for (let k = 0; k <= 23; k++) {
        s = s + ptsA[k] * Math.cos(ptsB[k] * 2 * Math.PI / 360 + ptsC[k] * 2 * Math.PI / 360 * t);
    }
    const w = 35999.373 * t - 2.47;
    const l = 1 + 0.0334 * Math.cos(w * 2 * Math.PI / 360) + 0.0007 * Math.cos(2 * w * 2 * Math.PI / 360);
    return 0.00001 * s / l;
}

/**
 * 求算以含冬至中气为阴历11月开始的连续16个朔望月
 * @param year 年份
 * @param wJD 冬至的儒略日历时间
 * @return array
 */
export function SMSinceWinterSolstice(year, wJD) {
    let j, k;
    const tjd = [];

    const jd = solar2julian(year - 1, 11, 1, 0, 0, 0);
    const nm = meanNewMoon(jd);
    const kn = nm[0];
    for (let i = 0; i <= 19; i++) {
        k = kn + i;
        tjd[i] = trueNewMoon(k) + 1 / 3;
        tjd[i] = tjd[i] - DeltaT(year, i - 1) / 1440;
    }
    for (j = 0; j <= 18; j++) {
        if (Math.floor(tjd[j] + 0.5) > Math.floor(wJD + 0.5)) {
            break;
        }
    }

    const JDs = [];
    for (k = 0; k <= 15; k++) {
        JDs.push(tjd[j - 1 + k])
    }
    return JDs;
}

/**
 * 求出以某年立春点开始的节(注意:为了方便计算起运数,此处第0位为上一年的小寒)
 * @param year
 * @return array jq[(2*k+21)%24]
 */
export function pureJQSinceSpring(year) {
    let k;
    const jdpjq = [];

    let dj = adjustedJQ(year - 1, 19, 23); //求出含指定年立春开始之3个节气JD值,以前一年的年值代入
    for (k in dj) {
        if (k < 19 || k > 23 || k % 2 === 0) {
            continue;
        }
        jdpjq.push(dj[k]); //19小寒;20大寒;21立春;22雨水;23惊蛰
    }

    dj = adjustedJQ(year, 0, 25); //求出指定年节气之JD值,从春分开始,到大寒,多取两个确保覆盖一个公历年,也方便计算起运数
    for (k in dj) {
        if (k % 2 === 0) {
            continue;
        }
        jdpjq.push(dj[k]);
    }
    return jdpjq;
}

/**
 * 获取指定年的春分开始作perturbation調整後的24节气,可以多取2个
 * @param year
 * @param start 0-25
 * @param end 0-25
 * @return array
 */
export function adjustedJQ(year, start, end) {
    if (start < 0 || 25 < start || end < 0 || 25 < end) {
        return [];
    }
    const jq = [];

    const Jd4JQ = meanJQJD(year);
    for (let k = 0; k < Jd4JQ.length; k++) {
        if (k < start || k > end) {
            continue;
        }
        const ptb = perturbation(Jd4JQ[k]);
        const dt = DeltaT(year, Math.floor((k + 1) / 2) + 3);
        jq[k] = Jd4JQ[k] + ptb - dt / 60 / 24;
        jq[k] = jq[k] + 1 / 3;
    }
    return jq;
}

/**
 * 求出自冬至点为起点的连续15个中气
 * @param year
 * @return array jq[(2*k+18)%24]
 */
export function ZQSinceWinterSolstice(year) {
    const JD4ZQ = [];

    let dj = adjustedJQ(year - 1, 18, 23);
    JD4ZQ[0] = dj[18]; //冬至
    JD4ZQ[1] = dj[20]; //大寒
    JD4ZQ[2] = dj[22]; //雨水

    dj = adjustedJQ(year, 0, 23);
    for (const k in dj) {
        if (k % 2 !== 0) {
            continue;
        }
        JD4ZQ.push(dj[k]);
    }

    return JD4ZQ;
}

/**
 * 以比较日期法求算冬月及其余各月名称代码,包含闰月,冬月为0,腊月为1,正月为2,余类推.闰月多加0.5
 * @param year
 */
export function ZQAndSMandLunarMonthCode(year) {
    let i;
    const mc = [];

    const jd4zq = ZQSinceWinterSolstice(year);
    const jd4sm = SMSinceWinterSolstice(year, jd4zq[0]);
    let yz = 0;
    if (Math.floor(jd4zq[12] + 0.5) >= Math.floor(jd4sm[13] + 0.5)) {
        for (i = 1; i <= 14; i++) {
            if (Math.floor((jd4sm[i] + 0.5) > Math.floor(jd4zq[i - 1 - yz] + 0.5) && Math.floor(jd4sm[i + 1] + 0.5) <= Math.floor(jd4zq[i - yz] + 0.5))) {
                mc[i] = i - 0.5;
                yz = 1;
            } else {
                mc[i] = i - yz;
            }
        }
    } else {
        for (i = 0; i <= 12; i++) {
            mc[i] = i;
        }
        for (i = 13; i <= 14; i++) {
            if (Math.floor((jd4sm[i] + 0.5) > Math.floor(jd4zq[i - 1 - yz] + 0.5) && Math.floor(jd4sm[i + 1] + 0.5) <= Math.floor(jd4zq[i - yz] + 0.5))) {
                mc[i] = i - 0.5;
                yz = 1;
            } else {
                mc[i] = i - yz;
            }
        }
    }
    return [jd4zq, jd4sm, mc];
}

// 公历转农历
export function solar2lunar(year, month, day) {
    if (!dateIsOk(year, month, day)) return undefined;

    let mData = ZQAndSMandLunarMonthCode(year);
    let jd4sm = mData[1];
    let mc = mData[2];

    const jd = solar2julian(year, month, day, 12, 0, 0); //求出指定年月日之JD值
    let mi = 0;
    let prev = 0;
    if (Math.floor(jd) < Math.floor(jd4sm[0] + 0.5)) {
        prev = 1;
        mData = ZQAndSMandLunarMonthCode(year - 1);
        jd4sm = mData[1];
        mc = mData[2];
    }
    for (let i = 0; i <= 14; i++) {
        if (Math.floor(jd) >= Math.floor(jd4sm[i] + 0.5) && Math.floor(jd) < Math.floor(jd4sm[i + 1] + 0.5)) {
            mi = i;
            break;
        }
    }

    if (mc[mi] < 2 || prev === 1) {
        year = year - 1;
    }
    month = (Math.floor(mc[mi] + 10) % 12) + 1;
    day = Math.floor(jd) - Math.floor(jd4sm[mi] + 0.5) + 1;

    let isLeap = (mc[mi] - Math.floor(mc[mi])) * 2 + 1 !== 1;
    return [year, month, day, isLeap];
}

/**
 * 农历转公历
 * @param year
 * @param month
 * @param day
 * @param isLeap
 * @returns {boolean|boolean|*}
 */
export function lunar2solar(year, month, day, isLeap=false) {
    if (year < -1000 || 3000 < year || month < 1 || 12 < month || day < 1 || 30 < day) {
        return false;
    }

    const lm = ZQAndSMandLunarMonthCode(year);
    const jd4sm = lm[1];
    const mc = lm[2];

    let leap = 0;
    for (let j = 1; j <= 14; j++) {
        if (mc[j] - Math.floor(mc[j]) > 0) {
            leap = Math.floor(mc[j] + 0.5);
            break;
        }
    }

    month = month + 2;

    const nofd = [];
    for (let i = 0; i <= 14; i++) {
        nofd[i] = Math.floor(jd4sm[i + 1] + 0.5) - Math.floor(jd4sm[i] + 0.5);
    }

    let jd = null;
    if (isLeap) {
        if (leap >= 3 && leap === month && day <= nofd[month]) {
            jd = jd4sm[month] + day - 1;
        }
    } else {
        const rate = leap === 0 ? 0 : 1;
        if (day <= nofd[month - 1 + rate * (month > leap)]) {
            jd = jd4sm[month - 1 + rate * (month > leap)] + day - 1;
        }
    }
    return jd === null ? false : julian2solar(jd).slice(0, 3);
}

/**
 * 获取公历某个月有多少天
 * @param year
 * @param month
 * @returns {number}
 */
export function solarMonthHasDays(year, month) {
    if (year < -1000 || year > 3000 || month < 1 || month > 12) {
        return 0;
    }
    const ndf1 = -(year % 4 === 0);
    const ndf2 = ((year % 400 === 0) - (year % 100 === 0)) && (year > 1582);
    const ndf = ndf1 + ndf2;
    return 30 + ((Math.abs(month - 7.5) + 0.5) % 2) - (month === 2) * (2 + ndf);
}

/**
 * 获取农历某个月有多少天
 * @param year
 * @param month
 * @param isLeap
 * @returns {number|*}
 */
export function lunarMonthHasDays(year, month, isLeap) {
    if (year < -1000 || year > 3000 || month < 1 || month > 12) {
        return 0;
    }
    const lm = ZQAndSMandLunarMonthCode(year);
    const jdnm = lm[1];
    const mc = lm[2];

    let leap = 0;
    for (let j = 1; j <= 14; j++) {
        if (mc[j] - Math.floor(mc[j]) > 0) {
            leap = Math.floor(mc[j] + 0.5);
            break;
        }
    }
    month = month + 2;
    const nofd = [];
    for (let i = 0; i <= 14; i++) {
        nofd[i] = Math.floor(jdnm[i + 1] + 0.5) - Math.floor(jdnm[i] + 0.5); //每月天数,加0.5是因JD以正午起算
    }

    if (isLeap) {
        if (leap >= 3 && leap === month) {
            return nofd[month]
        } else {
            return 0
        }
    } else {
        return  nofd[month - 1 + (leap !== 0 && month > leap)]
    }
}

/**
 * 获取一年的12个节气['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒']对应的公历日期
 * @param year
 * @returns {*[]}
 */
export function yearJieQi(year) {
    const jds = pureJQSinceSpring(year)
    const dates = []
    for (let i = 1; i < 14; i++) {
        dates.push([...julian2solar(jds[i]), jds[i]])
    }
    return dates.map((d, i, all) => {
        return {
            jd: d[6],
            year: d[0],
            month: d[1],
            day: d[2],
            hour: d[3],
            minute: d[4],
            second: d[5],
            dm: i < 12 ? (all[i+1][1] + 12 - all[i][1]) % 12 : null, // 当前月 - 下一个月，得出两个月的差值
            dd: i < 12 ? all[i+1][2] : null
        }
    }).slice(0, 12)
}

/**
 * 获取干支信息
 * @param year
 * @param month
 * @param day
 * @param hour
 * @param minute
 * @param second
 * @param zwz 区分早晚子时
 * @returns {{jqi: number, g: *[], jq: *[], z: *[], jd: number}|{}}
 */
export function gzi(year, month, day, hour, minute = 0, second = 0, zwz = false) {

    const info = {
        g: [], // 天干
        z: [], // 地址
        jd: 0, // 对应的儒略日
        jq: [], // 日期前后节气的儒略日
        jqi: 0, // 对应的节气索引
    }

    info.jd = solar2julian(year, month, day, hour, minute, Math.max(1, second));
    if (!info.jd) return {};

    let jq = pureJQSinceSpring(year);
    if (info.jd < jq[1]) {
        year = year - 1;
        jq = pureJQSinceSpring(year);
    }

    const yearGZ = ((year + 4712 + 24) % 60 + 60) % 60;
    info.g[0] = yearGZ % 10; //年干
    info.z[0] = yearGZ % 12; //年支

    for (let j = 0; j <= 15; j++) {
        if (jq[j] >= info.jd) {
            info.jqi = j - 1;
            break;
        }
    }

    info.jq = [jq[info.jqi], jq[info.jqi + 1]]

    const monthGZ = (((year + 4712) * 12 + (info.jqi - 1) + 60) % 60 + 50) % 60;
    info.g[1] = monthGZ % 10; //月干
    info.z[1] = monthGZ % 12; //月支

    const jda = info.jd + 0.5;
    const dayJD = Math.floor(jda) + (((jda - Math.floor(jda)) * 86400) + 3600) / 86400;
    const dgz = (Math.floor(dayJD + 49) % 60 + 60) % 60;
    info.g[2] = dgz % 10; //日干
    info.z[2] = dgz % 12; //日支
    if (zwz && (hour >= 23)) { //区分早晚子时,日柱前移一柱
        info.g[2] = (info.g[2] + 10 - 1) % 10;
        info.z[2] = (info.z[2] + 12 - 1) % 12;
    }

    const dh = dayJD * 12;
    const hgz = (Math.floor(dh + 48) % 60 + 60) % 60;
    info.g[3] = hgz % 10; //时干
    info.z[3] = hgz % 12; //时支

    return info;
}

/**
 * 根据公历年月日排盘
 * @param male true男false女
 * @param year
 * @param month
 * @param day
 * @param hour
 * @param minute
 * @param second
 * @param zwz 区分早晚子时
 * @returns {{lucky: {datetime: *[], g: *[], z: *[], desc: string}, basic: {g: *[], z: *[]}, shiren: {datetime: string, year: number, rang: *[]}}}
 */
export const plate = function (male, year, month, day, hour, minute = 0, second = 0, zwz=false) {
    let i, span;
    const plate = {
        basic: { // 四柱天干地址
            g: [],
            z: [],
        },
        lucky: { // 大运天干地址
            desc: '', // 起运日期描述
            g: [],
            z: [],
            datetime: [] // 每个大运对应的起运具体时间
        },
        shiren: { // 实仁排盘的起运时间
            datetime: '',
            year: 0,
            rang: [], // 每个大运对应的的具体起运日期
        }
    };

    const info = gzi(year, month, day, hour, minute, second, zwz);
    plate.basic.g = info.g
    plate.basic.z = info.z

    const JQs = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪'] // 12节气，不包含另外12中气
    plate['birth'] = {
        front: {
            name: JQs[info.jqi % 12],
            time: datetime2string(julian2solar(info.jq[0]))
        },
        back: {
            name: JQs[(info.jqi + 1) % 12],
            time: datetime2string(julian2solar(info.jq[1]))
        }
    }

    const pn = plate.basic.g[0] % 2;
    let srSpan;
    if ((male && pn === 0) || (!male && pn === 1)) { //起大运时间,阳男阴女顺排
        srSpan = shirenSpan(info.jd, info.jq[1], true)
        span = info.jq[1] - info.jd; //往后数一个节,计算时间跨度
        for (i = 1; i <= 12; i++) {
            plate.lucky.g.push((plate.basic.g[1] + i) % 10);
            plate.lucky.z.push((plate.basic.z[1] + i) % 12);
        }
    } else { // 阴男阳女逆排,往前数一个节
        srSpan = shirenSpan(info.jd, info.jq[0], false)
        span = info.jd - info.jq[0];
        for (i = 1; i <= 12; i++) {
            plate.lucky.g.push((plate.basic.g[1] + 20 - i) % 10);
            plate.lucky.z.push((plate.basic.z[1] + 24 - i) % 12);
        }
    }

    const days = Math.floor(span * 4 * 30);
    const y = Math.floor(days / 360);
    const m = Math.floor(days % 360 / 30);
    const d = Math.floor(days % 360 % 30);
    plate.lucky.desc = y + "年" + m + "月" + d + "天起运";

    const startJDTime = info.jd + span * 120;
    for (i = 0; i < 12; i++) {
        plate.lucky.datetime.push(datetime2string(julian2solar(startJDTime + i * 10 * 360)));
    }

    // 公历A转为农历B，农历B年份加上起运年龄，月、天不变，则新的农历B1日期时间则为起运日期，如果B1对应的公历A1不存在，则进行闰月和减一天的操作，让A1存在
    // 计算实仁起运时间
    const startAge = parseInt((srSpan / 3).toFixed())
    const lunarDate = solar2lunar(year, month, day)
    lunarDate[0] += startAge // 出生日期农历年平移到起运年

    let shirenLuckyDay = offsetLunar2solar(lunarDate)
    plate.shiren.datetime =  datetime2string(shirenLuckyDay).slice(0, 10)
    plate.shiren.year = shirenLuckyDay[0]

    for (let i = 0; i < 11; i++) {
        lunarDate[0] += 10
        plate.shiren.rang.push(datetime2string(offsetLunar2solar(lunarDate)).trimRight())
    }

    return plate;
}

/**
 * 实仁计算span
 * @param birthtimeJD 出生时间儒略日
 * @param nearbyJD 靠近的节气儒略日
 * @param forward 顺排还是逆排
 * @returns {number}
 */
function shirenSpan(birthtimeJD, nearbyJD, forward) {
    const diff = julian2solar(birthtimeJD).slice(0, 3).join(".") === julian2solar(nearbyJD).slice(0, 3).join(".") ? 0 : 1;

    // 儒略日格式化为整数(即从当天12时计算),从生日到节气的间隔+节气那天(出生这天和节气不是同一天的时候，才额外加)
    return Math.abs(Math.floor(birthtimeJD) - (forward ? Math.floor(nearbyJD) : Math.ceil(nearbyJD))) + diff
}

/**
 * 偏移农历到公历
 * @param lunarDate
 * @returns {*}
 */
export function offsetLunar2solar(lunarDate) {
    let shirenLuckyDay = lunar2solar(...lunarDate)
    if (shirenLuckyDay === false) { // 如果平移后的日期不存在
        if (lunarDate[3] === true) { // 平移的日期为闰月，转为非闰月重试
            lunarDate[3] = false
            shirenLuckyDay = lunar2solar(...lunarDate)
            if (shirenLuckyDay === false) { // 平移后的日期不存在(平移后，大月(30)变小月(29))
                lunarDate[2] -= 1
                shirenLuckyDay = lunar2solar(...lunarDate)
            }
        } else { // 平移日期不存在，大小月问题
            lunarDate[2] -= 1
            shirenLuckyDay = lunar2solar(...lunarDate)
        }
    }
    return shirenLuckyDay
}

/**
 * 根据八字干支查找对应的公历日期
 * @param yearColumn 年柱的60甲子年索引
 * @param monthColumn 月柱的60甲子年索引
 * @param dayColumn 日柱的60甲子年索引
 * @param hourColumn 时柱的60甲子年索引
 * @param zzs 早(true)/晚(false)子时，时柱为X子才会生效
 * @param startYear
 * @param mx
 */
export function gz2datetime(yearColumn, monthColumn, dayColumn, hourColumn, zzs = true, startYear = 1500, mx = 17) {
    const CycleIndex = (startYear + 56) % 60 // 求出开始那年对应60甲子年的索引
    const diff = (yearColumn + 60 - CycleIndex) % 60 // 计算输入年柱与1500对应年柱的差值,yearColumn+60把输入的年柱切换到下一个周期，以保证比1500年的甲子年索引大，再通过取余60回到60甲子年内

    let sii = (monthColumn + 10) % 12 // SolarItermIndex 因为一年12个月与12地支一一对应(索引上偏差2，所以使用12-2=10进行矫正)，12个地支跟12节气对应

    const datetime = []

    for (let m = 0; m <= mx - 1; m++) {
        let sis = pureJQSinceSpring(startYear + diff + 60 * m).slice(1) // 因为需要从立春开始算，去掉第一个去年的小寒
        let headSi = sis[sii] // 月头对应的节气
        let footSi = sis[sii + 1] // 月尾对应的节气
        let headCycleIndex = (Math.floor(headSi) + 49) % 60 // 儒略日历时间0日为癸丑日,六十甲子代码为49
        let dayDiff = (dayColumn + 60 - headCycleIndex) % 60 // 输入的日期到月头间隔的日子(一般不超过30，因为一个月30天，只能循环60甲子中的一半)
        let theDayJd = Math.floor(headSi + dayDiff) // 计算出输入四柱对应的日期
        let theHour = hourColumn % 12 // 计算出时支

        let id, fd

        if (theHour === 0) {
            if (zzs) { // 早
                id = theDayJd + (theHour * 2 - 12) / 24
                fd = theDayJd + (theHour * 2 - 11) / 24
            } else { // 晚
                id = theDayJd + (theHour * 2 + 10) / 24
                fd = theDayJd + (theHour * 2 + 12) / 24 - 0.00000001
            }
        } else {
            id = theDayJd + (theHour * 2 - 13) / 24
            fd = theDayJd + (theHour * 2 - 11) / 24
        }
        if (fd < headSi || footSi < id) continue // 此八字在此60年中不存在

        let startJd, endJd
        if (headSi < id && fd < footSi) { // 没有跨节
            startJd = id
            endJd = fd
        }
        if (id < headSi && headSi < fd) { // 同一个时辰跨越了节:在节气月头,只包含时辰后段
            startJd = headSi
            endJd = fd
        }
        if (id < footSi && footSi < fd) { // 同一个时辰跨越了节:在节气月尾,只包含时辰前段
            startJd = id
            endJd = footSi
        }
        datetime.push([julian2solar(startJd), julian2solar(endJd)]) // 儒略日历时间转成公历时间
    }
    return datetime
}

/**
 * 日期时间数组转为字符串
 * @param data
 * @returns {string}
 */
export function datetime2string(data) {
    return data.slice(0, 3).map((v) => { return `${v}`.padStart(2, '0') }).join('-') + ' ' + data.slice(3, 6).map((v) => { return `${v}`.padStart(2, '0') }).join(':')
}
