const { Collection } = require("mongodb")
const errlogger = require("../utils/errorLogger")

const errorMessage = "Invalid DB Type"

const regressionStatusCardFromDb = async (dbType, client, collectionName, user, boolean) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = []
                if (boolean) {
                    data = await db
                        .collection(collectionName)
                        .aggregate([
                            {
                                $facet: {
                                    regData: [
                                        {
                                            $match: user
                                        },
                                        {
                                            $project: {
                                                startTime: {
                                                    $dateFromString: {
                                                        dateString: "$startTime"
                                                    }
                                                },
                                                totalTC: 1,
                                                norunTC: 1,
                                                passTC: 1,
                                                failTC: 1,
                                                run_id: 1
                                            }
                                        },
                                        {
                                            $sort: {
                                                startTime: -1
                                            }
                                        },
                                        {
                                            $group: {
                                                _id: "$user",
                                                totalTc: {
                                                    $sum: "$totalTC"
                                                },
                                                totalregressions: {
                                                    $sum: 1
                                                },
                                                norunTC: {
                                                    $sum: "$norunTC"
                                                },
                                                passTC: {
                                                    $sum: "$passTC"
                                                },
                                                failTC: {
                                                    $sum: "$failTC"
                                                },
                                                startTime: {
                                                    $max: "$startTime"
                                                },
                                                doc: {
                                                    $first: "$$ROOT"
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: "$doc._id",
                                                regressionName: "$doc.run_id",
                                                totalTc: 1,
                                                totalregressions: 1,
                                                norunTC: 1,
                                                passTC: 1,
                                                failTC: 1,
                                                startTime: 1
                                            }
                                        }
                                    ],
                                    compareRegCount: [
                                        {
                                            $project: {
                                                weeklyCount: {
                                                    $cond: [
                                                        {
                                                            $gte: [
                                                                {
                                                                    $dateFromString: {
                                                                        dateString:
                                                                            "$startTime"
                                                                    }
                                                                },
                                                                new Date(
                                                                    new Date().getTime() -
                                                                    7 *
                                                                    24 *
                                                                    60 *
                                                                    60 *
                                                                    1000
                                                                )
                                                            ]
                                                        },
                                                        { $literal: 1 },
                                                        { $literal: 0 }
                                                    ]
                                                },
                                                monthlyCount: {
                                                    $cond: [
                                                        {
                                                            $gte: [
                                                                {
                                                                    $dateFromString: {
                                                                        dateString:
                                                                            "$startTime"
                                                                    }
                                                                },
                                                                new Date(
                                                                    new Date().getTime() -
                                                                    30 *
                                                                    24 *
                                                                    60 *
                                                                    60 *
                                                                    1000
                                                                )
                                                            ]
                                                        },
                                                        { $literal: 1 },
                                                        { $literal: 0 }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $group: {
                                                _id: 1,
                                                weekCount: { $sum: "$weeklyCount" },
                                                monthCount: { $sum: "$monthlyCount" }
                                            }
                                        }
                                    ],
                                    duration: [
                                        {
                                            $project: {
                                                startTime: {
                                                    $dateFromString: {
                                                        dateString: "$startTime"
                                                    }
                                                },
                                                job: 1
                                            }
                                        },
                                        {
                                            $match: {
                                                startTime: {
                                                    $gt: new Date(
                                                        new Date().getTime() -
                                                        30 * 24 * 60 * 60 * 1000
                                                    )
                                                }
                                            }
                                        },
                                        {
                                            $unwind: "$job"
                                        },
                                        {
                                            $project: {
                                                duration: {
                                                    $subtract: [
                                                        {
                                                            $dateFromString: {
                                                                dateString:
                                                                    "$job.jobEndTime"
                                                            }
                                                        },
                                                        {
                                                            $dateFromString: {
                                                                dateString:
                                                                    "$job.jobStartTime"
                                                            }
                                                        }
                                                    ]
                                                },
                                                weeklyCount: {
                                                    $cond: [
                                                        {
                                                            $gte: [
                                                                {
                                                                    $dateFromString: {
                                                                        dateString:
                                                                            "$job.jobEndTime"
                                                                    }
                                                                },
                                                                new Date(
                                                                    new Date().getTime() -
                                                                    7 *
                                                                    24 *
                                                                    60 *
                                                                    60 *
                                                                    1000
                                                                )
                                                            ]
                                                        },
                                                        {
                                                            $literal: 1
                                                        },
                                                        {
                                                            $literal: 0
                                                        }
                                                    ]
                                                },
                                                monthlyCount: {
                                                    $cond: [
                                                        {
                                                            $gte: [
                                                                {
                                                                    $dateFromString: {
                                                                        dateString:
                                                                            "$job.jobEndTime"
                                                                    }
                                                                },
                                                                new Date(
                                                                    new Date().getTime() -
                                                                    30 *
                                                                    24 *
                                                                    60 *
                                                                    60 *
                                                                    1000
                                                                )
                                                            ]
                                                        },
                                                        {
                                                            $literal: 1
                                                        },
                                                        {
                                                            $literal: 0
                                                        }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $group: {
                                                _id: 1,
                                                weeklyDuration: {
                                                    $sum: {
                                                        $cond: [
                                                            {
                                                                $eq: [1, "$weeklyCount"]
                                                            },
                                                            "$duration",
                                                            0
                                                        ]
                                                    }
                                                },
                                                monthlyDuration: {
                                                    $sum: {
                                                        $cond: [
                                                            {
                                                                $eq: [1, "$monthlyCount"]
                                                            },
                                                            "$duration",
                                                            0
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                weekDuration: {
                                                    $divide: ["$weeklyDuration", 1000]
                                                },
                                                monthDuration: {
                                                    $divide: ["$monthlyDuration", 1000]
                                                }
                                            }
                                        }
                                    ],
                                }
                            }
                        ])
                        .toArray();
                }

                let jobCount = await db.collection(collectionName).aggregate([{ $match: user }, { $unwind: '$job' }, {
                    $project: {
                        jobName: "$job.job_id",
                        dut: "$job.dutId"
                    }
                }]).toArray();
                return { data, jobCount }
            } catch (e) {
                errlogger.error(e)
                throw new Error(errorMessage)

            }
        } else {
            throw new Error(errorMessage)
        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)

    }
}


const getLastFiveRegressionFromDB = async (dbType, client, collectionName, regStartTime) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([

                        {
                            $addFields: {
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime"
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                startTime: {
                                    $lte: new Date(regStartTime)
                                }
                            }
                        },
                        {
                            $sort: {
                                startTime: -1
                            }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $unwind: "$job"
                        },
                        {
                            $addFields: {
                                "job.jobStartTime": {
                                    $dateFromString: {
                                        dateString: "$job.jobStartTime"
                                    }
                                }
                            }
                        },
                        {
                            $sort: {
                                "job.jobStartTime": -1
                            }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $project: {
                                tagName: "$tagName",
                                jobName: "$job.job_id",
                                testbed: "$job.testbed",
                                totalTC: "$job.totalTC",
                                passTC: "$job.passTC",
                                failTC: "$job.failTC",
                                norunTC: "$job.norunTC",
                                jobStartTime: "$job.jobStartTime",
                                onExecution: "$job.onExecution",
                                firmwareVersion: "$job.firmwareVersion"
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (e) {
                errlogger.error(e)
                throw new Error(errorMessage)
            }
        } else {
            throw new Error(errorMessage)
        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)
    }
}


const getRegressionByDateFromDB = async (dbType, client, collectionName, details) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $addFields: {
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime"
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                startTime: {
                                    $gte: new Date(details.fromDate),
                                    $lte: new Date(details.toDate)
                                }
                            }
                        },
                        {
                            $unwind: "$job"
                        },

                        {
                            $addFields: {
                                model: { $regexMatch: { input: "$job.testbedData", regex: details.model } }
                            }
                        },
                        {
                            $match: { model: true }
                        },

                        {
                            $project: {
                                tagName: "$tagName",
                                jobName: "$job.job_id",
                                testbed: "$job.testbed",
                                totalTC: "$job.totalTC",
                                passTC: "$job.passTC",
                                failTC: "$job.failTC",
                                norunTC: "$job.norunTC",
                                jobStartTime: "$job.jobStartTime",
                                onExecution: "$job.onExecution",
                                firmwareVersion: "$job.firmwareVersion"
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (e) {
                errlogger.error(e)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)
    }
}

const getReservationStatusDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let deviceCount = await db
                    .collection(collectionName + "_Devices")
                    .aggregate([
                        {
                            $facet: {
                                vendorCount: [
                                    {
                                        $match: { vendors: { $exists: true } }
                                    },
                                    {
                                        $project: { count: { $size: "$vendors" } }
                                    }
                                ],
                                profileCount: [
                                    {
                                        $match: { deviceProfile: { $exists: true } }
                                    },
                                    {
                                        $project: { count: { $size: "$deviceProfile" } }
                                    }
                                ],
                                modelCount: [
                                    {
                                        $match: { modelName: { $exists: true } }
                                    },
                                    {
                                        $group: { _id: null, count: { $sum: 1 } }
                                    }
                                ],
                                deviceCount: [
                                    {
                                        $match: { deviceName: { $exists: true } }
                                    },
                                    {
                                        $group: { _id: null, count: { $sum: 1 } }
                                    }
                                ],
                                lastDevice: [
                                    {
                                        $match: { deviceName: { $exists: true } }
                                    },
                                    {
                                        $sort: { createdAt: -1 }
                                    },
                                    {
                                        $limit: 1
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: "$vendorCount"
                        },
                        {
                            $unwind: "$profileCount"
                        },
                        {
                            $unwind: "$modelCount"
                        },
                        {
                            $unwind: "$deviceCount"
                        },
                        {
                            $unwind: "$lastDevice"
                        },
                        {
                            $project: {
                                vendorCount: { $ifNull: ["$vendorCount.count", 0] },
                                profileCount: { $ifNull: ["$profileCount.count", 0] },
                                modelCount: { $ifNull: ["$modelCount.count", 0] },
                                deviceCount: { $ifNull: ["$deviceCount.count", 0] },
                                lastDevice: "$lastDevice.deviceName"
                            }
                        }
                    ])
                    .toArray();
                let reservationCount = await db
                    .collection(collectionName + "_Reservations")
                    .aggregate([
                        {
                            $facet: {
                                activeCount: [
                                    {
                                        $match: { active: true }
                                    },
                                    {
                                        $group: { _id: null, count: { $sum: 1 } }
                                    }
                                ],
                                completedCount: [
                                    {
                                        $match: { active: false }
                                    },
                                    {
                                        $group: { _id: null, count: { $sum: 1 } }
                                    }
                                ],
                                devicesCount: [
                                    {
                                        $match: { active: true }
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            count: { $sum: { $size: "$deviceIds" } }
                                        }
                                    }
                                ],
                                reservationCount: [
                                    {
                                        $group: { _id: null, count: { $sum: 1 } }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: {
                                path: "$activeCount",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: "$completedCount"
                        },
                        {
                            $unwind: {
                                path: "$devicesCount",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: "$devicesCount",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: "$reservationCount",
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $project: {
                                activeCount: { $ifNull: ["$activeCount.count", 0] },
                                completedCount: {
                                    $ifNull: ["$completedCount.count", 0]
                                },
                                devicesCount: { $ifNull: ["$devicesCount.count", 0] },
                                reservationCount: {
                                    $ifNull: ["$reservationCount.count", 0]
                                }
                            }
                        }
                    ])
                    .toArray();
                return { deviceCount, reservationCount }
            } catch (e) {
                errlogger.error(e)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)

        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)
    }
}

const getRegressionAnalysisDataFromDB = async (dbType, client, collectionName, deviceDB, testbedDB) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()

            try {

                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {
                                device_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            },
                                            reservationType: { $in: ["DEVICES"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$deviceIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "_id",
                                            foreignField: "_id",
                                            as: "deviceDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            deviceName: "$deviceDetails.deviceName",
                                            createdAt: "$deviceDetails.createdAt"
                                        }
                                    }
                                ],
                                device_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            },
                                            reservationType: { $in: ["DEVICES"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$deviceIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "_id",
                                            foreignField: "_id",
                                            as: "deviceDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            deviceName: "$deviceDetails.deviceName",
                                            createdAt: "$deviceDetails.createdAt"
                                        }
                                    }
                                ],
                                device: [
                                    {
                                        $match: {
                                            reservationType: { $in: ["DEVICES"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$deviceIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "_id",
                                            foreignField: "_id",
                                            as: "deviceDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            deviceName: "$deviceDetails.deviceName",
                                            createdAt: "$deviceDetails.createdAt"
                                        }
                                    }
                                ],
                                reservation_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$createdAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                reservation_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$createdAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                reservation: [
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$createdAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                status_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$status",
                                            bookingCount: {
                                                $sum: 1
                                            },
                                            deviceCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "DEVICES"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            testbedCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "TESTBED"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ],
                                status_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$status",
                                            bookingCount: {
                                                $sum: 1
                                            },
                                            deviceCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "DEVICES"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            testbedCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "TESTBED"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ],
                                status: [
                                    {
                                        $group: {
                                            _id: "$status",
                                            bookingCount: {
                                                $sum: 1
                                            },
                                            deviceCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "DEVICES"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            testbedCount: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: [
                                                                "$reservationType",
                                                                "TESTBED"
                                                            ]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    }
                                ],
                                testbed_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            },
                                            reservationType: { $in: ["TESTBED"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$testbedIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$testbedIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testbedDB,
                                            foreignField: "_id",
                                            localField: "_id",
                                            as: "testbedDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$testbedDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            testbedName: "$testbedDetails.testBedName",
                                            testbedId: "$testbedDetails._id"
                                        }
                                    }
                                ],
                                testbed_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            },
                                            reservationType: { $in: ["TESTBED"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$testbedIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$testbedIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testbedDB,
                                            foreignField: "_id",
                                            localField: "_id",
                                            as: "testbedDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$testbedDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            testbedName: "$testbedDetails.testBedName",
                                            testbedId: "$testbedDetails._id"
                                        }
                                    }
                                ],
                                testbed: [
                                    {
                                        $match: {
                                            reservationType: { $in: ["TESTBED"] },
                                            status: {
                                                $in: ["DEVICE_RELEASED", "TRIGGERED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$testbedIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$testbedIds",
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testbedDB,
                                            foreignField: "_id",
                                            localField: "_id",
                                            as: "testbedDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$testbedDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            duration: 1,
                                            testbedName: "$testbedDetails.testBedName",
                                            testbedId: "$testbedDetails._id"
                                        }
                                    }
                                ],
                                unReservedDevice: [
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            deviceIds: {
                                                $addToSet: "$deviceIds"
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            deviceIds: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            let: {
                                                deviceIds: "$deviceIds"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            _id: "$$deviceIds"
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "unUsedDevices"
                                        }
                                    },
                                    {
                                        $project: {
                                            unUsedDevices: {
                                                $filter: {
                                                    input: "$unUsedDevices",
                                                    as: "item",
                                                    cond: {
                                                        $not: {
                                                            $in: [
                                                                "$$item._id",
                                                                "$deviceIds"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            unUsedDevices: {
                                                $filter: {
                                                    input: "$unUsedDevices",
                                                    as: "item",
                                                    cond: {
                                                        $ifNull: [
                                                            "$$item.deviceName",
                                                            false
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$unUsedDevices"
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: "$unUsedDevices"
                                        }
                                    }
                                ],
                                unReservedTestbed: [
                                    {
                                        $unwind: "$testbedIds"
                                    },
                                    {
                                        $group: {
                                            _id: null,
                                            testbedIds: {
                                                $addToSet: "$testbedIds"
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            testbedIds: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testbedDB,
                                            let: {
                                                testbedIds: "$testbedIds"
                                            },
                                            pipeline: [
                                                {
                                                    $match: {
                                                        $expr: {
                                                            _id: "$$testbedIds"
                                                        }
                                                    }
                                                }
                                            ],
                                            as: "unUsedTestbed"
                                        }
                                    },
                                    {
                                        $project: {
                                            unUsedTestbed: {
                                                $filter: {
                                                    input: "$unUsedTestbed",
                                                    as: "item",
                                                    cond: {
                                                        $not: {
                                                            $in: [
                                                                "$$item._id",
                                                                "$testbedIds"
                                                            ]
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            unUsedTestbed: {
                                                $filter: {
                                                    input: "$unUsedTestbed",
                                                    as: "item",
                                                    cond: {
                                                        $ifNull: [
                                                            "$$item.testBedName",
                                                            false
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$unUsedTestbed"
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: "$unUsedTestbed"
                                        }
                                    }
                                ],
                                deviceStreak: [
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$deviceIds",
                                            lastReservation: {
                                                $max: "$reserveTime"
                                            }
                                        }
                                    },
                                    {
                                        $sort: {
                                            lastReservation: 1
                                        }
                                    },

                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "_id",
                                            foreignField: "_id",
                                            as: "deviceDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            lastReservation: 1,
                                            deviceName: "$deviceDetails.deviceName"
                                        }
                                    }
                                ],
                                testbedStreak: [
                                    {
                                        $unwind: "$testbedIds"
                                    },
                                    {
                                        $group: {
                                            _id: "$testbedIds",
                                            lastReservation: {
                                                $max: "$reserveTime"
                                            }
                                        }
                                    },
                                    {
                                        $sort: {
                                            lastReservation: 1
                                        }
                                    },

                                    {
                                        $lookup: {
                                            from: testbedDB,
                                            localField: "_id",
                                            foreignField: "_id",
                                            as: "testbedDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$testbedDetails"
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            lastReservation: 1,
                                            testbedName: "$testbedDetails.testBedName"
                                        }
                                    }
                                ],
                                reserveTime: [
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$reserveTime"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                reserveTime_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$reserveTime"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                reserveTime_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$reserveTime"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                releaseTime: [
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$releaseAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                releaseTime_7: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 7
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$releaseAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                releaseTime_30: [
                                    {
                                        $match: {
                                            createdAt: {
                                                $gte: new Date(
                                                    new Date().getTime() -
                                                    24 * 60 * 60 * 1000 * 30
                                                )
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                $dayOfWeek: "$releaseAt"
                                            },
                                            bookingCount: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch {
                errlogger.error(errorMessage)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)
    }
}
const getTestExecutionAnalysisFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $group: {
                                _id: null,
                                passTc: { $sum: "$passTC" },
                                failTC: { $sum: "$failTC" },
                                norunTC: { $sum: "$norunTC" },
                                totalTc: { $sum: "$totalTC" }
                            }
                        },
                        {
                            $project: { _id: 0 }
                        }
                    ])
                    .toArray();
                return data
            } catch (e) {
                errlogger.error(e)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getDetailedTestExecutionAnalysisFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {
                                yearlyData: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime"
                                                }
                                            },
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            job: 1
                                        }
                                    },
                                    {
                                        $project: {
                                            startTime: 1,
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            year: { $year: "$startTime" }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: { year: "$year" },
                                            totalTC: { $sum: "$totalTC" },
                                            passTC: { $sum: "$passTC" },
                                            failTC: { $sum: "$failTC" },
                                            norunTC: { $sum: "$norunTC" },
                                            totalReg: { $sum: 1 }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            year: "$_id.year",
                                            totalReg: 1,
                                            regressions: 1
                                        }
                                    }
                                ],
                                monthlyData: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime"
                                                }
                                            },
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            job: 1
                                        }
                                    },
                                    {
                                        $project: {
                                            startTime: 1,
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            job: 1,
                                            year: { $year: "$startTime" },
                                            month: { $month: "$startTime" }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: { year: "$year", month: "$month" },
                                            totalTC: { $sum: "$totalTC" },
                                            passTC: { $sum: "$passTC" },
                                            failTC: { $sum: "$failTC" },
                                            norunTC: { $sum: "$norunTC" },
                                            totalReg: { $sum: 1 }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            totalTC: { $sum: "$totalTC" },
                                            passTC: { $sum: "$passTC" },
                                            failTC: { $sum: "$failTC" },
                                            norunTC: { $sum: "$norunTC" },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            totalReg: 1
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            monthlyData: { $push: "$$ROOT" }
                                        }
                                    }
                                ],
                                dailyData: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime"
                                                }
                                            },
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            job: 1
                                        }
                                    },
                                    {
                                        $project: {
                                            startTime: 1,
                                            _id: 1,
                                            run_id: 1,
                                            user: 1,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            team: 1,
                                            regStatus: 1,
                                            job: 1,
                                            year: { $year: "$startTime" },
                                            month: { $month: "$startTime" },
                                            day: { $dayOfMonth: "$startTime" }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month",
                                                day: "$day"
                                            },
                                            totalTC: { $sum: "$totalTC" },
                                            passTC: { $sum: "$passTC" },
                                            failTC: { $sum: "$failTC" },
                                            norunTC: { $sum: "$norunTC" },
                                            totalReg: { $sum: 1 },
                                            allTC: {
                                                $push: {
                                                    _id: "$$ROOT._id",
                                                    run_id: "$$ROOT.run_id",
                                                    totalTc: "$$ROOT.totalTC",
                                                    passTC: "$$ROOT.passTC",
                                                    failTC: "$$ROOT.failTC",
                                                    norunTC: "$$ROOT.norunTC"
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            day: "$_id.day",
                                            totalReg: 1,
                                            allTC: 1
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}


const getCPEDetailedDataFromDB = async (dbType, client, collectionName, deviceDB, matched_device_profiles) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                // let regressionDB = collectionName + "_Regression";
                // let deviceDB = collectionName + "_Devices";
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {/*
                        allData: [
                            {
                                $unwind: "$job"
                            },
                            {
                                $unwind: "$job.onExecution"
                            },
                            {
                                $unwind: "$job.testbed.nodes"
                            },
                            {
                                $project: {
                                    deviceId: "$job.testbed.nodes.deviceId",
                                    passTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "Pass"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    failTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "Fail"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    norunTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "NoExec"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: "$deviceId",
                                    passTC: {
                                        $sum: "$passTC"
                                    },
                                    failTC: {
                                        $sum: "$failTC"
                                    },
                                    norunTC: {
                                        $sum: "$norunTC"
                                    },
                                    totalTC: {
                                        $sum: 1
                                    }
                                }
                            },
                            {
                                $project: {
                                    passTC: 1,
                                    failTC: 1,
                                    norunTC: 1,
                                    totalTC: 1,
                                    _id: {
                                        $convert: {
                                            input: "$_id",
                                            to: "objectId",
                                            onError: 0
                                        }
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: deviceDB,
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "deviceData"
                                }
                            },
                            {
                                $unwind: "$deviceData"
                            },
                            {
                                $replaceRoot: {
                                    newRoot: {
                                        $mergeObjects: ["$deviceData", "$$ROOT"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    deviceName: 1,
                                    vendor: 1,
                                    model: 1,
                                    profileName: 1,
                                    profileId: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    passTC: 1,
                                    failTC: 1,
                                    norunTC: 1,
                                    totalTC: 1,
                                    year: 1
                                }
                            }
                        ],
                        yearlyData: [
                            {
                                $unwind: "$job"
                            },
                            {
                                $unwind: "$job.onExecution"
                            },
                            {
                                $unwind: "$job.testbed.nodes"
                            },
                            {
                                $addFields: {
                                    "job.jobStartTime": {
                                        $toDate: "$job.jobStartTime"
                                    }
                                }
                            },
                            {
                                $addFields: {
                                    year: { $year: "$job.jobStartTime" }
                                }
                            },
                            {
                                $project: {
                                    deviceId: "$job.testbed.nodes.deviceId",
                                    year: 1,
                                    passTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "Pass"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    failTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "Fail"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    },
                                    norunTC: {
                                        $cond: [
                                            {
                                                $eq: [
                                                    "$job.onExecution.tcStatus",
                                                    "NoExec"
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        deviceId: "$deviceId",
                                        year: "$year"
                                    },
                                    passTC: {
                                        $sum: "$passTC"
                                    },
                                    failTC: {
                                        $sum: "$failTC"
                                    },
                                    norunTC: {
                                        $sum: "$norunTC"
                                    },
                                    totalTC: {
                                        $sum: 1
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 0,
                                    totalTC: 1,
                                    passTC: 1,
                                    failTC: 1,
                                    norunTC: 1,
                                    year: "$_id.year",
                                    deviceId: {
                                        $convert: {
                                            input: "$_id.deviceId",
                                            to: "objectId",
                                            onError: 0
                                        }
                                    },
                                    totalReg: 1,
                                    regressions: 1
                                }
                            },
                            {
                                $lookup: {
                                    from: deviceDB,
                                    localField: "deviceId",
                                    foreignField: "_id",
                                    as: "deviceData"
                                }
                            },
                            {
                                $unwind: "$deviceData"
                            },
                            {
                                $replaceRoot: {
                                    newRoot: {
                                        $mergeObjects: ["$deviceData", "$$ROOT"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    deviceName: 1,
                                    vendor: 1,
                                    model: 1,
                                    profileName: 1,
                                    profileId: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    passTC: 1,
                                    failTC: 1,
                                    norunTC: 1,
                                    totalTC: 1,
                                    year: 1
                                }
                            }
                        ],*/
                                monthlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $unwind: "$job.testbed.nodes"
                                    },
                                    {
                                        $addFields: {
                                            "job.jobStartTime": {
                                                $toDate: "$job.jobStartTime"
                                            }
                                        }
                                    },
                                    {
                                        $addFields: {
                                            year: { $year: "$job.jobStartTime" },
                                            month: { $month: "$job.jobStartTime" }
                                        }
                                    },
                                    {
                                        $project: {
                                            deviceId: "$job.testbed.nodes.deviceId",
                                            year: 1,
                                            month: 1,
                                            passTC: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$job.onExecution.tcStatus",
                                                            "Pass"
                                                        ]
                                                    },
                                                    1,
                                                    0
                                                ]
                                            },
                                            failTC: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$job.onExecution.tcStatus",
                                                            "Fail"
                                                        ]
                                                    },
                                                    1,
                                                    0
                                                ]
                                            },
                                            norunTC: {
                                                $cond: [
                                                    {
                                                        $eq: [
                                                            "$job.onExecution.tcStatus",
                                                            "NoExec"
                                                        ]
                                                    },
                                                    1,
                                                    0
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                deviceId: "$deviceId",
                                                year: "$year",
                                                month: "$month"
                                            },
                                            passTC: {
                                                $sum: "$passTC"
                                            },
                                            failTC: {
                                                $sum: "$failTC"
                                            },
                                            norunTC: {
                                                $sum: "$norunTC"
                                            },
                                            totalTC: {
                                                $sum: 1
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 0,
                                            totalTC: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            deviceId: {
                                                $convert: {
                                                    input: "$_id.deviceId",
                                                    to: "objectId",
                                                    onError: 0
                                                }
                                            },
                                            totalReg: 1,
                                            regressions: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "deviceId",
                                            foreignField: "_id",
                                            as: "deviceData"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceData"
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: ["$deviceData", "$$ROOT"]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            deviceName: 1,
                                            vendor: 1,
                                            model: 1,
                                            profileName: 1,
                                            profileId: 1,
                                            createdAt: 1,
                                            updatedAt: 1,
                                            passTC: 1,
                                            failTC: 1,
                                            norunTC: 1,
                                            totalTC: 1,
                                            year: 1,
                                            month: 1
                                        }
                                    },
                                    {
                                        $match: {
                                            profileId: {
                                                $in: matched_device_profiles
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getCPEDetailedDataAllDevicesFromDB = async (dbType, client, collectionName, deviceDB, matched_device_profiles) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                // let regressionDB = collectionName + "_Regression";
                // let deviceDB = collectionName + "_Devices";
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {
                                allDeviceData: [
                                    {
                                        $match: {
                                            status: {
                                                $in: ["TRIGGERED", "DEVICE_RELEASED", "DEVICE_LOCKED"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: "$deviceIds"
                                    },
                                    {
                                        $addFields: {
                                            year: { $year: "$reserveTime" },
                                            month: { $month: "$reserveTime" }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                deviceId: {
                                                    $convert: {
                                                        input: "$deviceIds",
                                                        to: "objectId",
                                                        onError: 0
                                                    }
                                                },
                                                year: "$year", month: "$month"
                                            },
                                            noOfReservation: {
                                                $sum: 1
                                            },
                                            duration: {
                                                $sum: {
                                                    $subtract: [
                                                        "$releaseAt",
                                                        "$reserveTime"
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            noOfReservation: 1,
                                            deviceId: {
                                                $convert: {
                                                    input: "$_id.deviceId",
                                                    to: "objectId",
                                                    onError: 0
                                                }
                                            },
                                            duration: {
                                                $toInt: {
                                                    $ceil: {
                                                        $divide: [
                                                            "$duration",
                                                            {
                                                                $multiply: [1000, 60]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: deviceDB,
                                            localField: "deviceId",
                                            foreignField: "_id",
                                            as: "deviceDetails"
                                        }
                                    },
                                    {
                                        $unwind: "$deviceDetails"
                                    },
                                    {
                                        $project: {
                                            _id: "$_id.deviceId",
                                            noOfReservation: 1,
                                            duration: 1,
                                            vendor: "$deviceDetails.vendor",
                                            model: "$deviceDetails.model",
                                            profileId: "$deviceDetails.profileId",
                                            deviceName: "$deviceDetails.deviceName",
                                            createdAt: "$deviceDetails.createdAt",
                                            year: "$_id.year",
                                            month: "$_id.month"
                                        }
                                    },
                                    {
                                        $match: {
                                            profileId: {
                                                $in: matched_device_profiles
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getTcAnalysisCardDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $project: {
                                tcName: 1,
                                module: {
                                    $cond: [
                                        {
                                            $not: ["$moduleName"]
                                        },
                                        {
                                            $literal: 0
                                        },
                                        {
                                            $literal: 1
                                        }
                                    ]
                                },
                                testGroup: {
                                    $cond: [
                                        {
                                            $not: ["$testGroupName"]
                                        },
                                        {
                                            $literal: 0
                                        },
                                        {
                                            $literal: 1
                                        }
                                    ]
                                },
                                testSuite: {
                                    $cond: [
                                        {
                                            $not: ["$testSuiteName"]
                                        },
                                        {
                                            $literal: 0
                                        },
                                        {
                                            $literal: 1
                                        }
                                    ]
                                },
                                testcase: {
                                    $cond: [
                                        {
                                            $not: ["$tcName"]
                                        },
                                        {
                                            $literal: 0
                                        },
                                        {
                                            $literal: 1
                                        }
                                    ]
                                },
                                createdAt: {
                                    $dateFromString: {
                                        dateString: {
                                            $ifNull: ["$createdAt", null]
                                        },
                                        onNull: {
                                            $literal: 0
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $group: {
                                _id: 1,
                                module: {
                                    $sum: "$module"
                                },
                                testGroup: {
                                    $sum: "$testGroup"
                                },
                                testSuite: {
                                    $sum: "$testSuite"
                                },
                                testcase: {
                                    $sum: "$testcase"
                                },
                                createdAt: {
                                    $max: "$createdAt"
                                },
                                data: {
                                    $push: {
                                        tcName: "$$ROOT.tcName",
                                        createdAt: "$$ROOT.createdAt"
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                module: 1,
                                testGroup: 1,
                                testSuite: 1,
                                testcase: 1,
                                createdAt: 1,
                                tcName: {
                                    $filter: {
                                        input: "$data",
                                        as: "tc",
                                        cond: {
                                            $cond: [
                                                {
                                                    $eq: [
                                                        "$createdAt",
                                                        "$$tc.createdAt"
                                                    ]
                                                },
                                                "$$tc",
                                                false
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $unwind: "$tcName"
                        },
                        {
                            $project: {
                                module: 1,
                                testGroup: 1,
                                testSuite: 1,
                                testcase: 1,
                                createdAt: 1,
                                tcName: "$tcName.tcName"
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getROIDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db.collection(collectionName).aggregate([
                    { $match: { testGroupName: { $exists: true } } },
                    {
                        $group: {
                            _id: "$testGroupName",
                            easeOfAutomation: {
                                $avg: { $avg: "$easeOfAutomation.answer" }
                            },
                            impactOfAutomation: {
                                $avg: { $avg: "$impactOfAutomation.answer" }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: "$_id",
                            easeOfAutomation: {
                                $cond: [
                                    { $eq: ["$easeOfAutomation", null] },
                                    0,
                                    "$easeOfAutomation"
                                ]
                            },
                            impactOfAutomation: {
                                $cond: [
                                    { $eq: ["$impactOfAutomation", null] },
                                    0,
                                    "$impactOfAutomation"
                                ]
                            }
                        }
                    }
                ]).toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}


const getROICardDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db.collection(collectionName).aggregate([
                    { $match: { testGroupName: { $exists: true } } },
                    {
                        $group: {
                            _id: "$testGroupName",
                            easeOfAutomation: {
                                $avg: { $avg: "$easeOfAutomation.answer" }
                            },
                            impactOfAutomation: {
                                $avg: { $avg: "$impactOfAutomation.answer" }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: "$_id",
                            easeOfAutomation: {
                                $cond: [
                                    { $eq: ["$easeOfAutomation", null] },
                                    0,
                                    "$easeOfAutomation"
                                ]
                            },
                            impactOfAutomation: {
                                $cond: [
                                    { $eq: ["$impactOfAutomation", null] },
                                    0,
                                    "$impactOfAutomation"
                                ]
                            }
                        }
                    }
                ]).toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getFetchfFailReasonFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        { "$project": { "job_id": "$job.job_id" } }
                    ]).toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getLatestServerHygieneDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let hygieneData = await db
                    .collection(collectionName).aggregate([
                        {
                            $sort: {
                                time: -1
                            },
                        },
                        {
                            $limit: 1
                        }

                    ])
                    .toArray();
                return hygieneData
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getLastFiveModuleJobsFromDB = async (dbType, client, collectionName, moduleName, regStartTime) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        {

                            $match: { "job.modelName": moduleName }
                        },
                        {
                            $addFields: {
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime"
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                startTime: {
                                    $lte: new Date(regStartTime)
                                }
                            }
                        },
                        {
                            $sort: {
                                startTime: -1
                            }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $unwind: "$job"
                        },
                        {
                            $addFields: {
                                "job.jobStartTime": {
                                    $dateFromString: {
                                        dateString: "$job.jobStartTime"
                                    }
                                }
                            }
                        },
                        {
                            $sort: {
                                "job.jobStartTime": -1
                            }
                        },
                        {
                            $limit: 5
                        },
                        {
                            $project: {
                                tagName: "$tagName",
                                jobName: "$job.job_id",
                                testbed: "$job.testbed",
                                totalTC: "$job.totalTC",
                                passTC: "$job.passTC",
                                failTC: "$job.failTC",
                                norunTC: "$job.norunTC",
                                jobStartTime: "$job.jobStartTime",
                                onExecution: "$job.onExecution",
                                firmwareVersion: "$job.firmwareVersion"
                            }
                        }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}



const getTestcaseYearlyData = async (dbType, client, collectionName, testcaseDB, tgStringIds) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            let regressionDB = collectionName + "_Regression";
            try {
                var data = await db
                    .collection(regressionDB)
                    .aggregate([
                        {
                            $facet: {
                                yearlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            group: "$tcGroup.testGroupName",
                                            manualExec: 1
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            all: {
                                                $push: {
                                                    group: "$group",
                                                    count: "$count",
                                                    pass: "$pass",
                                                    fail: "$fail",
                                                    noRun: "$noRun",
                                                    autoExec: "$autoExec",
                                                    manualExec: "$manualExec",
                                                    tcGroupId: "$tcGroupId"
                                                }
                                            }
                                        }
                                    }
                                ],
                                monthlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            month: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            group: "$tcGroup.testGroupName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: { $push: "$$ROOT" }
                                        }
                                    }
                                ],
                                //Daily Data
                                dailyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            day: {
                                                $dayOfMonth: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year",
                                                month: "$month",
                                                day: "$day"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            day: "$_id.day",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            month: 1,
                                            day: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            group: "$tcGroup.testGroupName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: { $push: "$$ROOT" }
                                        }
                                    }
                                ],
                                regression_year: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            count: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                regression_month: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    }
                                ],
                                group_year: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                groupId: "$tcGroupId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            },
                                            regressionsd: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions",
                                                        regressionsd: "$regressionsd"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            groupId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],
                                group_month: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month",
                                                groupId: "$tcGroupId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            },
                                            regressionsd: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions",
                                                        regressionsd: "$regressionsd"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            groupId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],
                                tcDataMonthlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcName: "$job.onExecution.tcName",
                                            tcId: "$job.onExecution._id",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcName: 1,
                                            tcId: 1,
                                            tcStatus: 1,
                                            manualExec: {
                                                $toInt: "$manualExec"
                                            }
                                        }
                                    },
                                    { $match: { tcId: { $in: tcStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                id: "$tcId",
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: {
                                                $sum: "$duration"
                                            },
                                            manualExec: {
                                                $sum: "$manualExec"
                                            },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcId: {
                                                $toObjectId: "$_id.id"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcId",
                                            foreignField: "_id",
                                            as: "tc"
                                        }
                                    },
                                    {
                                        $unwind: "$tc"
                                    },
                                    {
                                        $project: {
                                            tcId: 1,
                                            year: 1,
                                            month: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            tcName: "$tc.tcName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: {
                                                $push: "$$ROOT"
                                            }
                                        }
                                    }
                                ],
                                group_month_tc: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tc: "$job.onExecution.tcName",
                                            tcId: "$job.onExecution._id"
                                        }
                                    },
                                    { $match: { tcId: { $in: tcStringIds } } },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tc: 1,
                                            tcId: 1
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month",
                                                tcId: "$tcId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            tcId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();
                return data

            } catch {
                errlogger.error(errorMessage)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (e) {
        errlogger.error(e)
        throw new Error(errorMessage)
    }
}


// await db.collection(jobColl).deleteMany();

const deleteDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                await db.collection(collectionName).deleteMany();
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

// var data =await db.collection(jobColl).insertMany(jsData, opts);

const InsertJobDataToDB = async (dbType, client, collectionName, jsData, opts) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                await db.collection(collectionName).insertMany(jsData, opts);
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
    catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getFirmwareTestedDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName)
                    .aggregate([
                        { $group: { _id: "$job.firmwareVersion" } },
                        { $project: { _id: 0, firmwareVersion: "$_id" } }
                    ])
                    .toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        } else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getDataAnalysisRegressionFromDB = async (dbType, client, collectionName, regStartTime, regEndTime) => {
    try {
        if (dbType === "MongoDB") {

            let db = client.db()
            try {
                if (req.body.selectedFirmware.length == 1 && req.body.platFormType.length == 1) {
                    dataEx = await db
                        .collection(collectionName)
                        .aggregate([
                            {
                                $addFields: {
                                    startTime: {
                                        $dateFromString: {
                                            dateString: "$startTime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    startTime: {
                                        $gte: new Date(regStartTime),
                                        $lte: new Date(regEndTime)

                                    }
                                }
                            },
                            {
                                $sort: {
                                    startTime: -1
                                }
                            },
                            {
                                $unwind: "$job"
                            },
                            {
                                $addFields: {
                                    "job.jobStartTime": {
                                        $dateFromString: {
                                            dateString: "$job.jobStartTime"
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    "job.jobStartTime": -1
                                }
                            },
                            {
                                $match: {
                                    "job.dutId": req.body.platFormType[0],
                                }
                            }, {
                                $match: {
                                    "job.firmwareVersion": req.body.selectedFirmware[0],
                                }
                            },
                            {
                                $project: {
                                    tagName: "$tagName",
                                    jobName: "$job.job_id",
                                    testbed: "$job.testbed",
                                    totalTC: "$job.totalTC",
                                    passTC: "$job.passTC",
                                    failTC: "$job.failTC",
                                    norunTC: "$job.norunTC",
                                    jobStartTime: "$job.jobStartTime",
                                    onExecution: "$job.onExecution",
                                    firmwareVersion: "$job.firmwareVersion",
                                    environment_type: "$job.environment_type",
                                    module: "$job.module",
                                    model: "$job.modelName",
                                    dutId: "$job.dutId",
                                    //job:"$job"
                                }
                            }
                        ])
                        .toArray();
                } else if (req.body.platFormType.length == 1) {
                    dataEx = await db
                        .collection(collectionName)
                        .aggregate([
                            {
                                $addFields: {
                                    startTime: {
                                        $dateFromString: {
                                            dateString: "$startTime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    startTime: {
                                        $gte: new Date(regStartTime),
                                        $lte: new Date(regEndTime)

                                    }
                                }
                            },
                            {
                                $sort: {
                                    startTime: -1
                                }
                            },
                            {
                                $unwind: "$job"
                            },
                            {
                                $addFields: {
                                    "job.jobStartTime": {
                                        $dateFromString: {
                                            dateString: "$job.jobStartTime"
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    "job.jobStartTime": -1
                                }
                            },
                            {
                                $match: {
                                    "job.dutId": req.body.platFormType[0],
                                }
                            },
                            {
                                $project: {
                                    tagName: "$tagName",
                                    jobName: "$job.job_id",
                                    testbed: "$job.testbed",
                                    totalTC: "$job.totalTC",
                                    passTC: "$job.passTC",
                                    failTC: "$job.failTC",
                                    norunTC: "$job.norunTC",
                                    jobStartTime: "$job.jobStartTime",
                                    onExecution: "$job.onExecution",
                                    firmwareVersion: "$job.firmwareVersion",
                                    environment_type: "$job.environment_type",
                                    module: "$job.module",
                                    model: "$job.modelName",
                                    dutId: "$job.dutId",
                                    //job:"$job"
                                }
                            }
                        ])
                        .toArray();
                } else if (req.body.selectedFirmware.length == 1) {
                    dataEx = await db
                        .collection(collectionName)
                        .aggregate([
                            {
                                $addFields: {
                                    startTime: {
                                        $dateFromString: {
                                            dateString: "$startTime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    startTime: {
                                        $gte: new Date(regStartTime),
                                        $lte: new Date(regEndTime)

                                    }
                                }
                            },
                            {
                                $sort: {
                                    startTime: -1
                                }
                            },
                            {
                                $unwind: "$job"
                            },
                            {
                                $addFields: {
                                    "job.jobStartTime": {
                                        $dateFromString: {
                                            dateString: "$job.jobStartTime"
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    "job.jobStartTime": -1
                                }
                            },
                            {
                                $match: {
                                    "job.firmwareVersion": req.body.selectedFirmware[0],
                                }
                            },
                            {
                                $project: {
                                    tagName: "$tagName",
                                    jobName: "$job.job_id",
                                    testbed: "$job.testbed",
                                    totalTC: "$job.totalTC",
                                    passTC: "$job.passTC",
                                    failTC: "$job.failTC",
                                    norunTC: "$job.norunTC",
                                    jobStartTime: "$job.jobStartTime",
                                    onExecution: "$job.onExecution",
                                    firmwareVersion: "$job.firmwareVersion",
                                    environment_type: "$job.environment_type",
                                    module: "$job.module",
                                    model: "$job.modelName",
                                    dutId: "$job.dutId",
                                    //job:"$job"
                                }
                            }
                        ])
                        .toArray();
                } else {
                    dataEx = await db
                        .collection(collectionName)
                        .aggregate([
                            {
                                $addFields: {
                                    startTime: {
                                        $dateFromString: {
                                            dateString: "$startTime"
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    startTime: {
                                        $gte: new Date(regStartTime),
                                        $lte: new Date(regEndTime)

                                    }
                                }
                            },
                            {
                                $sort: {
                                    startTime: -1
                                }
                            },
                            {
                                $unwind: "$job"
                            },
                            {
                                $addFields: {
                                    "job.jobStartTime": {
                                        $dateFromString: {
                                            dateString: "$job.jobStartTime"
                                        }
                                    }
                                }
                            },
                            {
                                $sort: {
                                    "job.jobStartTime": -1
                                }
                            },
                            {
                                $project: {
                                    tagName: "$tagName",
                                    jobName: "$job.job_id",
                                    testbed: "$job.testbed",
                                    totalTC: "$job.totalTC",
                                    passTC: "$job.passTC",
                                    failTC: "$job.failTC",
                                    norunTC: "$job.norunTC",
                                    jobStartTime: "$job.jobStartTime",
                                    onExecution: "$job.onExecution",
                                    firmwareVersion: "$job.firmwareVersion",
                                    environment_type: "$job.environment_type",
                                    module: "$job.module",
                                    model: "$job.modelName",
                                    dutId: "$job.dutId",
                                    //job:"$job"
                                }
                            }
                        ])
                        .toArray();
                }
                return dataEx
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getServerHygieneDataFromDB = async (dbType, client, collectionName, lowerdate, upperdate) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                let data = await db
                    .collection(collectionName).aggregate([
                        {
                            $sort: {
                                time: -1
                            },
                        },
                        {
                            $match: {
                                "time": {
                                    $gte: lowerdate.toISOString(),
                                    $lte: upperdate.toISOString()
                                }
                            }
                        },
                        {
                            $group: {

                                _id: "$serverIP",
                                hygiene_data: {
                                    $push: {
                                        id: "$_id",
                                        time: "$time",
                                        cpu: "$cpu",
                                        memory: "$memory",
                                        diskutilization: "$diskutilization",
                                        userLoggedin: "$userLoggedin",
                                        regressionRunning: "$regressionRunning",
                                        serverIP: "$serverIP",
                                        hostName: "$hostName"

                                    }

                                }

                            }

                        }
                    ])

                    .toArray();
                return data
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getTestcaseMonthlyDataFromDB = async (dbType, client, collectionName, tgStringIds) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()

            try {
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {
                                monthlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            month: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            group: "$tcGroup.testGroupName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: { $push: "$$ROOT" }
                                        }
                                    }
                                ],
                                regression_month: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    }
                                ],
                                group_year: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                groupId: "$tcGroupId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            },
                                            regressionsd: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions",
                                                        regressionsd: "$regressionsd"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            groupId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],
                                group_month: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month",
                                                groupId: "$tcGroupId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            },
                                            regressionsd: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions",
                                                        regressionsd: "$regressionsd"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            groupId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],

                            }
                        }
                    ])
                    .toArray();

                return data

            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getTestcaseYearlyDataFromDB = async (dbType, client, collectionName, tgStringIds) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {
                                yearlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            group: "$tcGroup.testGroupName",
                                            manualExec: 1
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            all: {
                                                $push: {
                                                    group: "$group",
                                                    count: "$count",
                                                    pass: "$pass",
                                                    fail: "$fail",
                                                    noRun: "$noRun",
                                                    autoExec: "$autoExec",
                                                    manualExec: "$manualExec",
                                                    tcGroupId: "$tcGroupId"
                                                }
                                            }
                                        }
                                    }
                                ],
                                regression_year: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            count: {
                                                $sum: 1
                                            }
                                        }
                                    }
                                ],
                                group_year: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                groupId: "$tcGroupId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            },
                                            regressionsd: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions",
                                                        regressionsd: "$regressionsd"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            groupId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ],

                            }
                        }
                    ])
                    .toArray();

                return data
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
    catch (err) {

        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getTestcaseDailyDataFromDB = async (dbType, client, collectionName, tgStringIds) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $facet: {



                                dailyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcGroup: "$job.onExecution.tcGroup",
                                            tcGroupId: "$job.onExecution.tcGroupId",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            day: {
                                                $dayOfMonth: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcGroup: 1,
                                            tcGroupId: 1,
                                            tcStatus: 1,
                                            manualExec: { $toInt: "$manualExec" }
                                        }
                                    },
                                    { $match: { tcGroupId: { $in: tgStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                group: "$tcGroupId",
                                                year: "$year",
                                                month: "$month",
                                                day: "$day"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: { $sum: "$duration" },
                                            manualExec: { $sum: "$manualExec" },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcGroupId: {
                                                $toObjectId: "$_id.group"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            day: "$_id.day",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcGroupId",
                                            foreignField: "_id",
                                            as: "tcGroup"
                                        }
                                    },
                                    {
                                        $unwind: "$tcGroup"
                                    },
                                    {
                                        $project: {
                                            tcGroupId: 1,
                                            year: 1,
                                            month: 1,
                                            day: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            group: "$tcGroup.testGroupName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: { $push: "$$ROOT" }
                                        }
                                    }
                                ],

                                regression_month: [
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            }
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    }
                                ],


                                tcDataMonthlyData: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcName: "$job.onExecution.tcName",
                                            tcId: "$job.onExecution._id",
                                            tcStatus: "$job.onExecution.tcStatus",
                                            tcStartTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStartTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tcStopTime: {
                                                $dateFromString: {
                                                    dateString:
                                                        "$job.onExecution.tcStopTime",
                                                    onError: new Date()
                                                }
                                            },
                                            manualExec:
                                                "$job.onExecution.manualExectime"
                                        }
                                    },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            duration: {
                                                $subtract: [
                                                    "$tcStopTime",
                                                    "$tcStartTime"
                                                ]
                                            },
                                            tcName: 1,
                                            tcId: 1,
                                            tcStatus: 1,
                                            manualExec: {
                                                $toInt: "$manualExec"
                                            }
                                        }
                                    },
                                    { $match: { tcId: { $in: tcStringIds } } },
                                    {
                                        $group: {
                                            _id: {
                                                id: "$tcId",
                                                year: "$year",
                                                month: "$month"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            autoExec: {
                                                $sum: "$duration"
                                            },
                                            manualExec: {
                                                $sum: "$manualExec"
                                            },
                                            pass: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Pass"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            fail: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "Fail"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            },
                                            noRun: {
                                                $sum: {
                                                    $cond: [
                                                        {
                                                            $eq: ["$tcStatus", "NoExec"]
                                                        },
                                                        1,
                                                        0
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            tcId: {
                                                $toObjectId: "$_id.id"
                                            },
                                            year: "$_id.year",
                                            month: "$_id.month",
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            autoExec: {
                                                $multiply: ["$autoExec", 0.001, 1 / 60]
                                            },
                                            manualExec: 1,
                                            _id: 0
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: testcaseDB,
                                            localField: "tcId",
                                            foreignField: "_id",
                                            as: "tc"
                                        }
                                    },
                                    {
                                        $unwind: "$tc"
                                    },
                                    {
                                        $project: {
                                            tcId: 1,
                                            year: 1,
                                            month: 1,
                                            count: 1,
                                            pass: 1,
                                            fail: 1,
                                            noRun: 1,
                                            _id: 0,
                                            autoExec: {
                                                $divide: [
                                                    {
                                                        $subtract: [
                                                            {
                                                                $multiply: [
                                                                    "$autoExec",
                                                                    100
                                                                ]
                                                            },
                                                            {
                                                                $mod: [
                                                                    {
                                                                        $multiply: [
                                                                            "$autoExec",
                                                                            100
                                                                        ]
                                                                    },
                                                                    1
                                                                ]
                                                            }
                                                        ]
                                                    },
                                                    100
                                                ]
                                            },
                                            manualExec: 1,
                                            tcName: "$tc.tcName"
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: "$year",
                                            data: {
                                                $push: "$$ROOT"
                                            }
                                        }
                                    }
                                ],
                                group_month_tc: [
                                    {
                                        $unwind: "$job"
                                    },
                                    {
                                        $unwind: "$job.onExecution"
                                    },
                                    {
                                        $project: {
                                            startTime: {
                                                $dateFromString: {
                                                    dateString: "$startTime",
                                                    onError: new Date()
                                                }
                                            },
                                            tc: "$job.onExecution.tcName",
                                            tcId: "$job.onExecution._id"
                                        }
                                    },
                                    { $match: { tcId: { $in: tcStringIds } } },
                                    {
                                        $project: {
                                            year: {
                                                $year: "$startTime"
                                            },
                                            month: {
                                                $month: "$startTime"
                                            },
                                            tc: 1,
                                            tcId: 1
                                        }
                                    },
                                    {
                                        $group: {
                                            _id: {
                                                year: "$year",
                                                month: "$month",
                                                tcId: "$tcId"
                                            },
                                            count: {
                                                $sum: 1
                                            },
                                            regressions: {
                                                $addToSet: "$$ROOT._id"
                                            }
                                        }
                                    },
                                    {
                                        $replaceRoot: {
                                            newRoot: {
                                                $mergeObjects: [
                                                    {
                                                        count: "$count",
                                                        regressions: "$regressions"
                                                    },
                                                    "$_id"
                                                ]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            year: 1,
                                            month: 1,
                                            tcId: 1,
                                            count: {
                                                $size: {
                                                    $reduce: {
                                                        input: "$regressions",
                                                        initialValue: [],
                                                        in: {
                                                            $let: {
                                                                vars: {
                                                                    elem: {
                                                                        $concatArrays: [
                                                                            ["$$this"],
                                                                            "$$value"
                                                                        ]
                                                                    }
                                                                },
                                                                in: {
                                                                    $setUnion: "$$elem"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ])
                    .toArray();

                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const FilteredDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(collectionName).aggregate([{ $match: { "job.testbed.testBedName": /EWAN/ } }, {
                    $sort: {
                        "_id": -1
                    }
                }, {
                    $project: {
                        "run_id": 1,
                        "job.job_id": 1,
                        "job.testbed.testBedName": 1
                    },
                }])
                    .toArray()
                return data

            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}
const FilteredDataFromDb = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(collectionName).aggregate([{ $match: { "job.testbed.testBedName": /XGSPON/ } }, {
                    $sort: {
                        "_id": -1
                    }
                }, {
                    $project: {
                        "run_id": 1,
                        "job.job_id": 1,
                        "job.testbed.testBedName": 1
                    },
                }])
                    .toArray()
                return data

            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}


const GetAllRegressionDataFromDB = async (dbType, client, collectionName, year) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db();
            try {
                var data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $project: {
                                _id: 0,
                                run_id: 1,
                                tagName: 1,
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime",
                                        onError: new Date(),
                                    },
                                },
                                "job.job_id": 1,
                                "job.onExecution": {
                                    _id: 1,
                                    tcGroupId: 1,
                                    tcGroup: 1,
                                    tcId: 1,
                                    tcName: 1,
                                    tcStatus: 1,
                                    autoExectime: 1,
                                    manualExectime: 1,
                                    errorCodes: 1,
                                    tcErrorCode: 1,
                                },
                                "job.manualEffortRequired": 1,
                                "job.automationExecTime": 1,
                                "job.errorCodes": 1,
                                "job.modelName": 1,
                                "job.totalTC": 1,
                                "job.failTC": 1,
                                "job.passTC": 1,
                                "job.teamName": 1,
                                "job.firmwareVersion": 1,
                                "job.job_status": 1,
                                "job.jobStartTime": 1,
                                "job.jobEndTime": 1,
                                "job.norunTC": 1,
                                user: 1,
                            },
                        },
                        {
                            $project: {
                                year: {
                                    $year: "$startTime",
                                },
                                run_id: 1,
                                tagName: 1,
                                "job.job_id": 1,
                                "job.onExecution": {
                                    _id: 1,
                                    tcGroupId: 1,
                                    tcGroup: 1,
                                    tcId: 1,
                                    tcName: 1,
                                    tcStatus: 1,
                                    autoExectime: 1,
                                    manualExectime: 1,
                                    errorCodes: 1,
                                    tcErrorCode: 1
                                },

                                "job.manualEffortRequired": 1,
                                "job.automationExecTime": 1,
                                "job.errorCodes": 1,
                                "job.modelName": 1,
                                "job.totalTC": 1,
                                "job.failTC": 1,
                                "job.passTC": 1,
                                "job.teamName": 1,
                                "job.firmwareVersion": 1,
                                "job.job_status": 1,
                                "job.jobStartTime": 1,
                                "job.jobEndTime": 1,
                                "job.norunTC": 1,
                                user: 1,
                            },
                        },
                        { $match: { year: year } }
                    ])
                    .toArray();


                return data
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
    catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }

}

const getAllRegressionYearDataFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            var db = await client.db();
            try {
                var years_data = await db
                    .collection(collectionName)
                    .aggregate([
                        {
                            $project: {
                                _id: 0,
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime",
                                        onError: new Date(),
                                    },
                                }
                            },
                        },
                        {
                            $project: {
                                year: {
                                    $year: "$startTime",
                                }
                            }
                        }
                    ])
                    .toArray();

                return years_data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getDataForTopRunTCFromDB = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(collectionName)
                    .aggregate([
                        {
                            $addFields: {
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime"
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                startTime: {
                                    $gte: new Date(regStartTime),
                                    $lte: new Date(regEndTime)
                                }
                            }
                        },
                        {
                            $sort: {
                                startTime: -1
                            }
                        },
                        {
                            $unwind: "$job"
                        },
                        {
                            $addFields: {
                                "job.jobStartTime": {
                                    $dateFromString: {
                                        dateString: "$job.jobStartTime"
                                    }
                                }
                            }
                        },
                        {
                            $sort: {
                                "job.jobStartTime": -1
                            }
                        },
                        {
                            $project: {
                                tagName: "$tagName",
                                jobName: "$job.job_id",
                                testbed: "$job.testbed",
                                totalTC: "$job.totalTC",
                                passTC: "$job.passTC",
                                failTC: "$job.failTC",
                                norunTC: "$job.norunTC",
                                jobStartTime: "$job.jobStartTime",
                                onExecution: "$job.onExecution",
                                firmwareVersion: "$job.firmwareVersion",
                                environment_type: "$job.environment_type",
                                module: "$job.module",
                                model: "$job.modelName",
                                dutId: "$job.dutId",
                                user: "$user"
                                //job:"$job"
                            }
                        }
                    ]).toArray();

                return data
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
    catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const getDataForTopRunTCFromDb = async (dbType, client, collectionName) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(collectionName)
                    .aggregate([
                        {
                            $addFields: {
                                startTime: {
                                    $dateFromString: {
                                        dateString: "$startTime"
                                    }
                                }
                            }
                        },
                        {
                            $match: {
                                startTime: {
                                    $gte: new Date(regStartTime),
                                    $lte: new Date(regEndTime)
                                }
                            }
                        },
                        {
                            $sort: {
                                startTime: -1
                            }
                        },
                        {
                            $unwind: "$job"
                        },
                        {
                            $addFields: {
                                "job.jobStartTime": {
                                    $dateFromString: {
                                        dateString: "$job.jobStartTime"
                                    }
                                }
                            }
                        },
                        {
                            $sort: {
                                "job.jobStartTime": -1
                            }
                        }, {
                            $match: {
                                "user": req.body.user,
                            }
                        },
                        {
                            $project: {
                                tagName: "$tagName",
                                jobName: "$job.job_id",
                                testbed: "$job.testbed",
                                totalTC: "$job.totalTC",
                                passTC: "$job.passTC",
                                failTC: "$job.failTC",
                                norunTC: "$job.norunTC",
                                jobStartTime: "$job.jobStartTime",
                                onExecution: "$job.onExecution",
                                firmwareVersion: "$job.firmwareVersion",
                                environment_type: "$job.environment_type",
                                module: "$job.module",
                                model: "$job.modelName",
                                dutId: "$job.dutId",
                                user: "$user"
                                //job:"$job"
                            }
                        }
                    ]).toArray();

                return data
            }
            catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }

        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    }
    catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}

const deviceprofileForCpedetailedFormDB = async (dbType, client, deviceDB) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(deviceDB).aggregate([
                    { $match: { "deviceProfile.connected_clients": true } },
                    { $unwind: "$deviceProfile" },
                    { $match: { "deviceProfile.connected_clients": true } }
                ]).toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}
const deviceProfileForDeviceProfileCpeDetailedFormDB = async (dbType, client, deviceDB) => {
    try {
        if (dbType === "MongoDB") {
            let db = client.db()
            try {
                var data = await db.collection(deviceDB).aggregate([
                    { $unwind: "$deviceProfile" }]).toArray();
                return data
            } catch (err) {
                errlogger.error(err)
                throw new Error(errorMessage)
            }
        }
        else {
            errlogger.error(errorMessage)
            throw new Error(errorMessage)
        }
    } catch (err) {
        errlogger.error(err)
        throw new Error(errorMessage)
    }
}


exports.regressionStatusCardFromDb = regressionStatusCardFromDb
exports.getLastFiveRegressionFromDB = getLastFiveRegressionFromDB
exports.getRegressionByDateFromDB = getRegressionByDateFromDB
exports.getReservationStatusDataFromDB = getReservationStatusDataFromDB
exports.getRegressionAnalysisDataFromDB = getRegressionAnalysisDataFromDB
exports.getTestExecutionAnalysisFromDB = getTestExecutionAnalysisFromDB
exports.getDetailedTestExecutionAnalysisFromDB = getDetailedTestExecutionAnalysisFromDB
exports.getCPEDetailedDataFromDB = getCPEDetailedDataFromDB
exports.getTcAnalysisCardDataFromDB = getTcAnalysisCardDataFromDB
exports.getROIDataFromDB = getROIDataFromDB
exports.getROICardDataFromDB = getROICardDataFromDB
exports.getFetchfFailReasonFromDB = getFetchfFailReasonFromDB
exports.getLatestServerHygieneDataFromDB = getLatestServerHygieneDataFromDB
exports.getLastFiveModuleJobsFromDB = getLastFiveModuleJobsFromDB
exports.getTestcaseYearlyData = getTestcaseYearlyData
exports.deleteDataFromDB = deleteDataFromDB
exports.InsertJobDataToDB = InsertJobDataToDB
exports.getFirmwareTestedDataFromDB = getFirmwareTestedDataFromDB
exports.getDataAnalysisRegressionFromDB = getDataAnalysisRegressionFromDB
exports.getServerHygieneDataFromDB = getServerHygieneDataFromDB
exports.getTestcaseMonthlyDataFromDB = getTestcaseMonthlyDataFromDB
exports.getTestcaseYearlyDataFromDB = getTestcaseYearlyDataFromDB
exports.getTestcaseDailyDataFromDB = getTestcaseDailyDataFromDB
exports.FilteredDataFromDB = FilteredDataFromDB
exports.FilteredDataFromDb = FilteredDataFromDb
exports.GetAllRegressionDataFromDB = GetAllRegressionDataFromDB
exports.getAllRegressionYearDataFromDB = getAllRegressionYearDataFromDB
exports.getDataForTopRunTCFromDB = getDataForTopRunTCFromDB
exports.getDataForTopRunTCFromDb = getDataForTopRunTCFromDb
exports.getCPEDetailedDataAllDevicesFromDB = getCPEDetailedDataAllDevicesFromDB
exports.deviceprofileForCpedetailedFormDB = deviceprofileForCpedetailedFormDB
exports.deviceProfileForDeviceProfileCpeDetailedFormDB = deviceProfileForDeviceProfileCpeDetailedFormDB