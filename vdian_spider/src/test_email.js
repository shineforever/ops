var nodemailer = require("nodemailer");
var helper = require("../helpers/webhelper.js");
var fs = require("fs");

// 开启一个 SMTP 连接池
var smtpTransport = nodemailer.createTransport("SMTP",{
  host: "smtp.163.com", // 主机
  secureConnection: true, // 使用 SSL
  port: 465, // SMTP 端口
  auth: {
    user: "mike442144@163.com", // 账号
    pass: "84424588*$$@$%**" // 密码
  }
});

var filePath = "../result/sofun_activity_"+new Date().toString()+".txt";
/*var cnt = "<table><tbody>"+fs.readFileSync(filePath).toString().split("\n").map(function(line){
    var row = line.split(',').map(function(field){
	return "<td>"+field+"</td>";
    }).join("");
    return "<tr>"+row+"</tr>";
}).join("")+"</tbody></table>";*/
var cnt = fs.readFileSync(filePath).toString().replace(/\n/g,'<br />');
// 设置邮件内容
var mailOptions = {
    from: "Mike <mike442144@163.com>", // 发件地址
    to: "790475083@qq.com, haidong.sun@bda.com, Meiqin.fang@bda.com, wenfeng.zhang@bda.com", // 收件列表
    subject: "Sofun Data", // 标题
    html: cnt
    //attachments:[{
	//filename:"sofun.txt",
	//path:filePath
	//content:fs.createReadStream(filePath)
    //}]
}
//console.log(mailOptions);
// 发送邮件

smtpTransport.sendMail(mailOptions, function(error, response){
  if(error){
    console.log(error);
  }else{
    console.log("Message sent: " + response.message);
  }
  smtpTransport.close(); // 如果没用，关闭连接池
});
