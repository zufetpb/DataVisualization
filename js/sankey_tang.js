width = document.getElementById("sankey").clientWidth
height = document.getElementById("sankey").clientHeight
node_color_info = new Map()

var svg = d3.select("#sankey").append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(-15,-15)")

var color = d3.scaleOrdinal(d3.schemeCategory20);

colors = [
    "#893448", //1
    "#c05050", //19
    "#d95850", //2
    "#d95850", //3
    "#eb8146", //4
    "#f5994e", //18
    "#ffb248", //5
    "#e5cf0d", //14
    "#f2d643", //6
    "#c6b38e", //23
    "#ffb980", //12
    "#dcc392", //26
    "#ebdba4", //7
    "#f3d999", //24
    "#f5e8c8", //21
    "#b8d2c7", //22

    "#edafda",
    "#d3758f", //25

    "#f58db2",
    "#f2b3c9",
    "#cbb0e3",
    "#9a7fd1", //16

    "#2ec7c9", //9
    "#b6a2de", //10
    "#5ab1ef", //11
    "#82b6e9", //29 
    "#82b6e9", //29
    "#07a2a4", //15
    "#e01f54", //17
    "#008acd", //8
    "#c14089", //20
    "#d87a80", //13

]
//不同算法对比
$("#sampling").on("click", function () {
    d3.select("#sankey").selectAll("#link_sky").remove()
    d3.select("#sankey").selectAll("#ori_node").remove()
    d3.select("#sankey").selectAll("#sam_node").remove()

    temp_str = $(".jws-text").text();
    temp_str = parseInt(temp_str.substring(0, temp_str.length - 1))
    temp_str = temp_str - (temp_str % 5)
    path = ""

    if ($("#No1").val() == "forestfire") {
        if (temp_str >= 5 && temp_str <= 80) path = `data/ansdata/filepath${temp_str}_com.csv`
        else if (temp_str < 5) path = `data/ansdata/filepath5_com.csv`
        else if (temp_str > 80) path = `data/ansdata/filepath80_com.csv`
    } else if ($("#No1").val() == "based on node") {
        if (temp_str >= 5 && temp_str <= 45) path = `data/bondata/bon${temp_str}_com.csv`
        else if (temp_str < 5) path = `data/bondata/bon5_com.csv`
        else if (temp_str > 45) path = `data/bondata/bon45_com.csv`
    } else if ($("#No1").val() == "randomwalk") {
        if (temp_str >= 5 && temp_str <= 45) path = `data/rmdata/rm${temp_str}_com.csv`
        else if (temp_str < 5) path = `data/rmdata/rm5_com.csv`
        else if (temp_str > 45) path = `data/rmdata/rm45_com.csv`
    }
    draw_sankey(path, temp_str)
})

function draw_sankey(path, temp_str) {
    d3.csv("data/ansdata/filepath_ori_com.csv", function (ori_nodes1) {
        d3.csv(path, function (sam_nodes1) {
            ans = find_com(50, ori_nodes1, sam_nodes1)
            ori_node_map = deal_ori_data(ans, ori_nodes1)
            sam_node_map = deal_sam_data(ans, sam_nodes1, temp_str)
            color_map_new(ans.diff_vector, ori_node_map, sam_node_map)
            draw_ori_node(ans, ori_node_map)
            draw_sam_node(ans, sam_node_map)
            link_data = deal_link_data(ans, ori_node_map, sam_node_map)
            draw_san_link(link_data)
            ori_node_colormap(ori_nodes1,sam_nodes1,ori_node_map)
        })
    })
}
d3.csv("data/ansdata/filepath_ori_com.csv", function (ori_nodes1) {
    d3.csv("data/ansdata/filepath80_com.csv", function (sam_nodes1) {
        ans = find_com(50, ori_nodes1, sam_nodes1)
        ori_node_map = deal_ori_data(ans, ori_nodes1)
        sam_node_map = deal_sam_data(ans, sam_nodes1, 80)
        color_map_new(ans.diff_vector, ori_node_map, sam_node_map)
        draw_ori_node(ans, ori_node_map)
        draw_sam_node(ans, sam_node_map)
        link_data = deal_link_data(ans, ori_node_map, sam_node_map)
        draw_san_link(link_data)
        ori_node_colormap(ori_nodes1,sam_nodes1,ori_node_map)
    })
})
//处理数据
function find_com(numbers_of_com, ori_nodes, sam_nodes) {
    ori_com_num = new Set()
    sam_com_num = new Set()

    var vector = []
    for (var i = 0; i < ori_nodes.length; i++) vector[i] = []
    for (var i = 0; i < ori_nodes.length; i++) vector[ori_nodes[i].id].push(Number(ori_nodes[i].com)),ori_com_num.add(Number(ori_nodes[i].com))
    for (var i = 0; i < sam_nodes.length; i++) vector[sam_nodes[i].id].push(Number(sam_nodes[i].com)),sam_com_num.add(Number(sam_nodes[i].com))

    ori_com_num = ori_com_num.size + 5
    sam_com_num = sam_com_num.size + 5
    // console.log(ori_com_num)
    // console.log(sam_com_num)

    ////社区匹配
    var diff_vector = []
    var diff_vector2 = []
    for (var i = 0; i < numbers_of_com; i++) diff_vector[i] = new Map()
    for (var i = 0; i < numbers_of_com * 2; i++) diff_vector2[i] = new Map()
    for (var i = 0; i < vector.length; i++) {
        if (vector[i].length == 2) {
            diff_vector[vector[i][0]].set(vector[i][1], 0)
        }
    }
    for (var i = 0; i < vector.length; i++) {
        if (vector[i].length == 2) {
            var num = diff_vector[vector[i][0]].get(vector[i][1])
            diff_vector[vector[i][0]].set(vector[i][1], num + 1)
        }
    }
    for (var i = 0; i < numbers_of_com; i++) {
        var temp_array = Array.from(diff_vector[i])
        temp_array.sort(function (a, b) {
            return b[1] - a[1]
        })
        // temp_array.shift()
        diff_vector[i] = new Map(temp_array.map(i => [i[0], i[1]]))
    }
    var diff_map = new Map()
    for (var i = 0; i < ori_nodes.length; i++) {
        var flag = 0
        for (var j = 0; j < sam_nodes.length; j++) {
            if (ori_nodes[i].id == sam_nodes[j].id) {
                var str_temp = ori_nodes[i].com + 'ori,' + sam_nodes[j].com + 'sam'
                if (!diff_map.has(str_temp)) diff_map.set(str_temp, [])

                var str_temp2 = sam_nodes[j].com + 'sam,' + ori_nodes[i].com + 'ori'
                if (!diff_map.has(str_temp2)) diff_map.set(str_temp2, [])
                flag=1
            }
        }
        if (!flag) {
            var str_temp = ori_nodes[i].com + 'ori'
            if (!diff_map.has(str_temp)) diff_map.set(str_temp, [])
        }
    }
    for (var i = 0; i < ori_nodes.length; i++) {
        var flag = 0
        for (var j = 0; j < sam_nodes.length; j++) {
            if (ori_nodes[i].id == sam_nodes[j].id) {
                var str_temp = ori_nodes[i].com + 'ori,' + sam_nodes[j].com + 'sam'
                var array_temp = diff_map.get(str_temp)
                array_temp.push(Number(ori_nodes[i].id))
                diff_map.set(str_temp, array_temp)

                var str_temp2 = sam_nodes[j].com + 'sam,' + ori_nodes[i].com + 'ori'
                var array_temp2 = diff_map.get(str_temp2)
                array_temp2.push(Number(ori_nodes[i].id))
                diff_map.set(str_temp2, array_temp2)
                flag = 1
            }
        }
        if (!flag) {
            var str_temp = ori_nodes[i].com + 'ori'
            var array_temp = diff_map.get(str_temp)
            array_temp.push(Number(ori_nodes[i].id))
            diff_map.set(str_temp, array_temp)
        }
    }
    for (var i = 0; i < numbers_of_com; i++) {
        diff_vector[i].forEach(function (value, key) {
            diff_vector2[key].set(i, value)
        })
    }
    for (var i = 0; i < numbers_of_com; i++) {
        var temp_array = Array.from(diff_vector2[i])
        temp_array.sort(function (a, b) {
            return b[1] - a[1]
        })
        diff_vector2[i] = new Map(temp_array.map(i => [i[0], i[1]]))
    }
    ans = {}
    ans.diff_vector = diff_vector
    ans.diff_map = diff_map
    ans.diff_vector2 = diff_vector2
    return ans
}

function color_map_new(diff_vector, ori_node_map, sam_node_map) {
    ori_node_map.forEach(function (value, key) {
        value.color = colors[value.id]
    })
    node_info = new Array(sam_node_map.size + 1).fill(0)
    for (i = 0; i < diff_vector.length; i++) {
        temp_array = Array.from(diff_vector[i])
        if (temp_array.length > 0) {
            sam_ind = temp_array[0][0]
            if (temp_array[0][1] > node_info[sam_ind]) {
                node_info[sam_ind] = temp_array[0][1]
                sam_node_map.get(sam_ind).color = ori_node_map.get(i).color
            }
        }
    }
    sam_node_map.forEach(function (value, key) {
        if (value.color == undefined) value.color = color(value.id)
    })
}
//原始节点处理
function deal_ori_data(ans, ori_nodes) {
    diff_map = ans.diff_map
    diff_vector = ans.diff_vector
    diff_vector2 = ans.diff_vector2

    var ori_node_map = new Map()
    //最大社区值
    var com_max = 0
    for (var i = 0; i < ori_nodes.length; i++) {
        com_max = Math.max(com_max, ori_nodes[i].com)
    }
    //每个社区的点的数量
    var node_info = new Array(com_max + 1).fill(0)
    for (var i = 0; i < ori_nodes.length; i++) {
        node_info[Number(ori_nodes[i].com)] += 1
    }
    node_info_map = new Map()
    for( i=0; i<com_max; i++ ){
        a = {
            id:i,
            node_num:node_info[i]
        }
        node_info_map.set(i,a)
    }
    node_info = Array.from(node_info_map)
    node_info.sort(function(a,b){
        return b[1].node_num-a[1].node_num
    })
    // console.log(node_info)

    var scale = d3.scaleLinear().domain([0, ori_nodes.length]).range([0, width- 5 - (com_max - 1) * 2])
    var temp_start = 20
    for (var i = 0; i < com_max; i++) {
        rect_id = node_info[i][0]
        var a = {
            "id": node_info_map.get(rect_id).id,
            "height": 10,
            "width": scale(node_info_map.get(rect_id).node_num),
            "dy": 20,
            "dx": temp_start,
            "num_of_node": node_info_map.get(rect_id).node_num,
        }
        temp_start += scale(node_info_map.get(rect_id).node_num)
        temp_start += 2
        ori_node_map.set(rect_id, a)
    }
    ori_node_map.com_max = com_max
    return ori_node_map
}

function draw_ori_node(ans, ori_node_map) {
    diff_map = ans.diff_map
    diff_vector = ans.diff_vector
    diff_vector2 = ans.diff_vector2

    ori_node_map.forEach(function (value, key) {
        value.info_entro = diff_vector[key].size
    })
    com_node_temp = Array.from(ori_node_map)
    com_node = []
    for (var i = 0; i < com_node_temp.length; i++) com_node.push(com_node_temp[i][1])
    var node_ori = svg.append("g")
        .attr("transform", "translate(0,0)")
        .selectAll("#ori_node")
        .data(com_node)
        .enter()
        .append("g")
        .attr("transform", "translate(0,0)")
        .attr("id", "ori_node")
        .append("rect")
        .attr("transform", function (d) {
            return "translate(" + d.dx + "," + d.dy + ")";
        })
        .attr("height", 25)
        .attr("width", function (d) {
            return d.width
        })
        .attr("fill", function (d) {
            return d.color
            // return color(d.id)
        })

    click_event(node_ori)

    //原始社区点击事件
    function click_event(node_ori){
        node_ori.on("click", function (d) {
            d3.selectAll("#original_node")
                // .style("fill", "#ccc")
                .style("stroke-width", 0)
                .attr("r", 7)

            d3.selectAll("#link_sky")
                .style("fill-opacity", function (dd) {
                    if (dd.source == d.id) return 1.0
                    else return 0.4
                })

            //属于某个社区,采样没采到
            // var array_temp2 = diff_map.get(d.id + 'ori')
            // d3.selectAll("#original_node")
            //     .attr("id", function (dd) {
            //         if (array_temp2.indexOf(Number(dd.id)) >= 0) {
            //             d3.select(this)
            //                 // .attr("r", 20)
            //                 .style("fill", d.color)
            //         }
            //         return "original_node"
            //     })
            diff_vector[d.id].forEach(function (value, key) {
                var array_temp = diff_map.get(d.id + 'ori,' + key + 'sam')
                d3.selectAll("#original_node")
                    .attr("id", function (dd) {
                        if (array_temp.indexOf(Number(dd.id)) >= 0) {
                            d3.select(this)
                                .attr("r", 9)
                                .style("fill", d.color)
                                .style("stroke", sam_node_map.get(key).color)
                                .style("stroke-width", 5)
                        }
                        return "original_node"
                    })
            })
        })
    }
}
//采样后节点处理
function deal_sam_data(ans, sam_nodes, smp_data) {
    diff_map = ans.diff_map
    diff_vector = ans.diff_vector
    diff_vector2 = ans.diff_vector2
    var sam_node_map = new Map()
    var node_info = new Map()
    for (var i = 0; i < sam_nodes.length; i++) {
        sam_nodes[i].com = Number(sam_nodes[i].com)
        node_info.set(sam_nodes[i].com, 0)
    }
    for (var i = 0; i < sam_nodes.length; i++) {
        node_info.set(sam_nodes[i].com, node_info.get(sam_nodes[i].com) + 1)
    }
    // 信息
    var scale_sam = d3.scaleLinear().domain([0, 100]).range([500, 1000])
    var scale = d3.scaleLinear().domain([0, sam_nodes.length]).range([0, scale_sam(smp_data) - (node_info.size - 1) * 2])
    for (var i = 0; i < node_info.size; i++) {
        temp_array = Array.from(diff_vector2[i])
        ori_ind = temp_array[0][0]
        var a = {
            "id": i,
            "height": 10,
            "width": scale(node_info.get(i)),
            "dy": 20,
            "dx": ori_node_map.get(ori_ind).dx,
            "num_of_node": node_info.get(i),
        }
        sam_node_map.set(i, a)
    }
    //解决覆盖问题
    sort_array = Array.from(sam_node_map)
    sort_array.sort(function (a, b) {
        return a[1].dx - b[1].dx
    })
    sort_array2 = new Array(sam_node_map.size).fill(-1)
    for (var i = 0; i < sam_node_map.size; i++) {
        sort_array2[i] = sort_array[i][0]
    }
    sam_node_map = new Map(sort_array.map(i => [i[0], i[1]]))
    temp_start = 20
    for (var i = 0; i < sam_node_map.size; i++) {
        temp_node = sam_node_map.get(sort_array2[i])
        temp_node.dx = temp_start
        temp_start += temp_node.width
        temp_start += 2
    }
    return sam_node_map
}

function draw_sam_node(ans, sam_node_map) {
    diff_map = ans.diff_map
    diff_vector = ans.diff_vector
    diff_vector2 = ans.diff_vector2
    com_node_temp = Array.from(sam_node_map)
    com_node_info = []
    for (var i = 0; i < com_node_temp.length; i++) com_node_info.push(com_node_temp[i][1])
    var node_sam = svg.append("g")
        .attr("transform", `translate(0,${height-35})`)
        .selectAll("#sam_node")
        .data(com_node_info)
        .enter()
        .append("g")
        .attr("transform", "translate(0,0)")
        .attr("id", "sam_node")
        .append("rect")
        .attr("transform", function (d) {
            return "translate(" + d.dx + "," + d.dy + ")";
        })
        .attr("height", 25)
        .attr("width", function (d) {
            return d.width
        })
        .attr("fill", function (d) {
            return d.color
        })
    
    click_event(node_sam)

    //采样社区点击事件
    function click_event(node_sam){
        node_sam.on("click", function (d) {
            d3.selectAll("#original_node")
                // .style("fill", "#ccc")
                .style("stroke-width", 0)
                .attr("r", 7)

            d3.selectAll("#link_sky")
                .style("fill-opacity", function (dd) {
                    if (dd.target == d.id) return 1.0
                    else return 0.4
                })
            diff_vector2[d.id].forEach(function (value, key) {
                var array_temp = diff_map.get(d.id + 'sam,' + key + 'ori')
                d3.selectAll("#original_node")
                    .attr("id", function (dd) {
                        if (array_temp.indexOf(Number(dd.id)) >= 0) {
                            d3.select(this)
                                .attr("r", 9)
                                .style("stroke", d.color)
                                // .style("stroke", ori_node_map.get(key).color)
                                .style("stroke-width", 5)
                        }
                        return "original_node"
                    })
            })
        })
    }
}
//边处理
function deal_link_data(ans, ori_node_map, sam_node_map) {
    // console.log(ori_node_map)
    // console.log(sam_node_map)
    function link_data(ans, ori_node_map, sam_node_map) {
        temp_data = []
        dict_array = new Array(sam_node_map.size + 1).fill(0)
        dict_array1 = new Array(ori_node_map.size + 1).fill(0)
        diff_vector2 = ans.diff_vector2
        for (var i = 0; i < diff_vector2.length; i++) {
            diff_vector2[i].forEach(function (value, key) {
                var a = []
                a.source = key
                a.target = i

                temp_node = ori_node_map.get(key)
                offeset = dict_array1[temp_node.id]
                a.x0 = temp_node.dx + offeset
                value_temp = value * temp_node.width / temp_node.num_of_node
                a.x3 = temp_node.dx + offeset + value_temp
                dict_array1[temp_node.id] += value_temp

                temp_node = sam_node_map.get(i)
                offeset = dict_array[temp_node.id]
                a.x1 = temp_node.dx + offeset
                value_temp = value * temp_node.width / temp_node.num_of_node
                a.x2 = temp_node.dx + offeset + value_temp
                dict_array[temp_node.id] += value_temp
                temp_data.push(a)
            })
        }
        // console.log(temp_data)
        return temp_data
    }
    return link_data(ans, ori_node_map, sam_node_map)
}
function draw_san_link(link_data) {
    function link(d) {
        curvature = .5;
        x0 = d.x0
        x1 = d.x1
        xi = d3.interpolateNumber(x0, x1)
        x2 = xi(curvature)
        x3 = xi(1 - curvature)
        y0 = 44
        y1 = 205
        temp_str = "M" + x0 + "," + y0 +
            " C" + x2 + "," + y0 +
            " " + x3 + "," + y1 +
            " " + x1 + "," + y1 +
            " L" + d.x2 + "," + y1
        x0 = d.x2
        x1 = d.x3
        xi = d3.interpolateNumber(x0, x1)
        x2 = xi(curvature)
        x3 = xi(1 - curvature)
        y0 = 205
        y1 = 44
        return temp_str +
            " C" + x2 + "," + y0 +
            " " + x3 + "," + y1 +
            " " + x1 + "," + y1 +
            " L" + d.x0 + "," + y1
    }
    var link = svg.append("g")
        .selectAll("#link_sky")
        .data(link_data)
        .enter()
        .append("path")
        .attr("id", "link_sky")
        .attr("d", function (d) {
            return link(d)
        })
        .style("fill", function (d) {
            return ori_node_map.get(d.source).color
        })
        .style("fill-opacity", 0.4)
        .style("stroke", "none")
}
//
function ori_node_colormap(ori_nodes,sam_nodes,ori_node_map){
    d3.selectAll("#original_node")
        .style("stroke_width",0)
    temp_map = new Map()
    for( i=0; i<sam_nodes.length; i++ ){
        for( j=0; j<ori_nodes.length; j++ ){
            if(sam_nodes[i].id==ori_nodes[j].id){
                a = {
                    id:Number(sam_nodes[i].id),
                    color:ori_node_map.get(Number(ori_nodes[j].com)).color
                }
                temp_map.set(Number(sam_nodes[i].id),a)
            }
        }
    }
    node_color_info = temp_map
    d3.selectAll("#original_node")
        .style("fill",function(d){
            if(temp_map.has(Number(d.id))) return node_color_info.get(Number(d.id)).color
            else return "#ccc"
        })
}
// function dragmove(d) {
//     d3.select(this)
//         .attr("transform", "translate(" + (d.dx = Math.max(0, Math.min(950, d3.event.x - d.width / 2))) + "," + d.dy + ")")
//     sam_node_map.get(d.id).dx = Math.max(0, Math.min(950, d3.event.x - d.width / 2))
//     redraw()
// }

// function redraw(d) {
//     d3.selectAll("#sam_node").remove()
//     d3.selectAll("#link_sky").remove()
//     draw_sam_node(ans, sam_node_map)
//     link_data = deal_link_data(ans, ori_node_map, sam_node_map)
//     draw_san_link(link_data)
// }