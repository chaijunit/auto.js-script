"ui";
(() => {
    ui.layout(
        <drawer id="drawer">
            <vertical>
                <appbar>
                    <toolbar id="toolbar"/>
                    <tabs id="tabs" />
                </appbar>
                <vertical>
                    <viewpager id="viewpager" layout_weight="1">
                        <frame>
                            <list id="abnormal_friend_list">
                                <horizontal padding="0 8">
                                    <checkbox id="selected_checkbox" layout_gravity="center" checked="{{selected}}" />
                                    <vertical>
                                        <text id="friend_remark_text" text="{{friend_remark}}" />
                                        <text id="we_chat_id_text" text="{{we_chat_id}}" />
                                        <text id="abnormal_message_text" text="{{abnormal_message}}" />
                                    </vertical>
                                </horizontal>
                            </list>
                        </frame>
                        <frame>
                            <list id="normal_friend_list">
                                <horizontal padding="0 8">
                                    <checkbox id="selected_checkbox" layout_gravity="center" checked="{{selected}}" />
                                    <vertical>
                                        <text id="friend_remark_text" text="{{friend_remark}}" />
                                        <text id="we_chat_id_text" text="{{we_chat_id}}" />
                                    </vertical>
                                </horizontal>
                            </list>
                        </frame>
                        <frame>
                            <list id="ignored_friend_list">
                                <text padding="8" text="{{friend_remark}}" />
                            </list>
                        </frame>
                    </viewpager>
                    <horizontal bg="#EBEBEB">
                        <button id="previous_page_button" layout_weight="1" style="Widget.AppCompat.Button.Borderless" textStyle="bold"/>
                        <text id="current_page_text" textStyle="bold"/>
                        <text textStyle="bold" text="  /  " />
                        <text id="total_page_text" textStyle="bold"/>
                        <button id="next_page_button" layout_weight="1" style="Widget.AppCompat.Button.Borderless" textStyle="bold"/>
                    </horizontal>
                    <horizontal bg="#EBEBEB">
                        <button id="clear_friends_button" layout_weight="1" style="Widget.AppCompat.Button.Borderless" textStyle="bold"/>
                        <button id="delete_friends_button" layout_weight="1" textColor="#CC0000" style="Widget.AppCompat.Button.Borderless" textStyle="bold"/>
                        <button id="test_friends_button" layout_weight="1" textColor="#008274" style="Widget.AppCompat.Button.Borderless" textStyle="bold"/>
                    </horizontal>
                </vertical>
            </vertical>
            <vertical layout_gravity="left" bg="#FFFFFF">
                <list id="side_list">
                    <horizontal>
                        <img w="50" h="50" padding="8" src="{{this.icon}}" tint="#009688" />
                        <text textColor="black" textSize="16sp" text="{{this.title}}" layout_gravity="center" />
                    </horizontal>
                </list>
            </vertical>
        </drawer>
    );

    let language, db_util, app_util, page_infos, current_page_index = 0, no_more_warning = false;

    /**
     * 初始化配置
     */
    function init() {
        db_util = require("utils/db_util.js");
        db_util.updateDatabase();
        app_util = require("utils/app_util.js");

        language = JSON.parse(files.read("config/languages/" + app_util.localLanguage() + ".json"));

        ui.previous_page_button.setText(language["previous_page"]);
        ui.next_page_button.setText(language["next_page"]);
        ui.clear_friends_button.setText(language["clear_friend"]);
        ui.delete_friends_button.setText(language["delete_friend"]);
        ui.test_friends_button.setText(language["test_friend"]);

        let supported_language = app_util.checkSupportedLanguage();
        ui.delete_friends_button.enabled = supported_language;
        ui.test_friends_button.enabled = supported_language;
        if (!supported_language) {
            ui.delete_friends_button.textColor = colors.parseColor("#B2B2B2");
            ui.test_friends_button.textColor = colors.parseColor("#B2B2B2");
            dialogs.build({
                content: "Does not support system language",
                positive: "Confirm",
                positiveColor: "#008274",
                cancelable: false
            }).show();
        }

        threads.start(function () {
            let update_util = require("utils/update_util.js");
            if (update_util.checkUpdate()) {
                let keep = true, yes = false;
                dialogs.build({
                    content: language["update_alert_dialog_message"],
                    positive: language["confirm"],
                    positiveColor: "#008274",
                    negative: language["cancel"],
                    negativeColor: "#008274",
                    cancelable: false
                }).on("positive", () => {
                    yes = true;
                    keep = false;
                }).show();
                while(keep) {
                }
                if (yes) {
                    update(update_util);
                }
            }
        });
    }
    init();

    /**
     * 初始化UI
     */
    function initUI() {
        ui.abnormal_friend_list.setDataSource(db_util.findAllAbnormalFriend());
        ui.normal_friend_list.setDataSource(db_util.findAllNormalFriend());
        ui.ignored_friend_list.setDataSource(db_util.findAllIgnoredFriend());

        page_infos = {};
        let abnormal_friends_total_page = db_util.getAbnormalFriendTotalPage();
        page_infos["abnormal_friends_page_info"] = {current_page: abnormal_friends_total_page > 0 ? 1 : '-', total_page: abnormal_friends_total_page > 0 ? abnormal_friends_total_page : '-'};
        let normal_friends_total_page = db_util.getNormalFriendTotalPage();
        page_infos["normal_friends_page_info"] = {current_page: normal_friends_total_page > 0 ? 1 : '-', total_page: normal_friends_total_page > 0 ? normal_friends_total_page : '-'};
        let ignored_friends_total_page = db_util.getIgnoredFriendTotalPage();
        page_infos["ignored_friends_page_info"] = {current_page: ignored_friends_total_page > 0 ? 1 : '-', total_page: ignored_friends_total_page > 0 ? ignored_friends_total_page : '-'};
        
        modifyPageInfoShow(page_infos["abnormal_friends_page_info"]);
    }
    initUI();

    /**
     * 更新
     * @param {*} update_util 
     */
    function update(update_util) {
        let updated = update_util.update();
        if (updated) {
            toast(language["update_success"]);
            engines.myEngine().forceStop();
            engines.execScriptFile("main.js");
        } else {
            dialogs.build({
                content: language["update_fail_alert_dialog_message"],
                negative: language["confirm"],
                negativeColor: "#008274",
                cancelable: false
            }).show();
        }
    }

    // 创建选项菜单(右上角)
    ui.emitter.on("create_options_menu", menu => {
        menu.add(language["update"]);
        menu.add(language["about"]);
    });
    // 监听选项菜单点击
    ui.emitter.on("options_item_selected", (e, item) => {
        switch (item.getTitle()) {
            case language["update"]:
                threads.start(function () {
                    let update_util = require("utils/update_util.js");
                    let result = update_util.checkUpdate();
                    if (result == undefined) {
                        dialogs.build({
                            content: language["get_update_info_fail_alert_dialog_message"],
                            positive: language["confirm"],
                            positiveColor: "#008274",
                            cancelable: false
                        }).show();
                    } else if (result) {
                        update(update_util);
                    } else {
                        dialogs.build({
                            content: language["no_need_update_alert_dialog_message"],
                            positive: language["confirm"],
                            positiveColor: "#008274",
                            cancelable: false
                        }).show();
                    }
                });
                break;
            case language["about"]:
                dialogs.build({
                    content: language["about_alert_dialog_message"],
                    positive: language["open_in_browser"],
                    positiveColor: "#008274",
                    negative: language["confirm"],
                    negativeColor: "#008274",
                    cancelable: false
                }).on("positive", () => {
                    app.openUrl("https://github.com/L8426936/");
                }).show();
                break
        }
        e.consumed = true;
    });
    ui.toolbar.title = language["app_name"];
    activity.setSupportActionBar(ui.toolbar);

    // 设置滑动页面的标题
    ui.viewpager.setTitles([language["abnormal_friend"], language["normal_friend"], language["ignored_friend"]]);
    // 让滑动页面和标签栏联动
    ui.tabs.setupWithViewPager(ui.viewpager);
    // 让工具栏左上角可以打开侧拉菜单
    ui.toolbar.setupWithDrawer(ui.drawer);
    ui.side_list.setDataSource([
        {
            icon: "@drawable/ic_label_black_48dp",
            title: language["label_whitelist"]
        },
        {
            icon: "@drawable/ic_person_black_48dp",
            title: language["friend_whitelist"]
        }
    ]);
    ui.side_list.on("item_click", item => {
        switch(item.title) {
            case language["label_whitelist"]:
                engines.execScriptFile("activity/label_whitelist.js");
                break;
            case language["friend_whitelist"]:
                engines.execScriptFile("activity/friend_whitelist.js");
                break;
        }
    });

    function modifyPageInfoShow(page_info) {
        ui.current_page_text.setText(String(page_info.current_page));
        ui.total_page_text.setText(String(page_info.total_page));
        ui.previous_page_button.enabled = page_info.current_page != 1 && page_info.current_page != '-';
        ui.next_page_button.enabled = page_info.current_page != page_info.total_page;
    }

    ui.previous_page_button.on("click", () => {
        switch (current_page_index) {
            case 0:
                page_infos["abnormal_friends_page_info"].current_page -= 1;
                ui.abnormal_friend_list.setDataSource(db_util.findAllAbnormalFriend(page_infos["abnormal_friends_page_info"].current_page));
                ui.abnormal_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["abnormal_friends_page_info"]);
                break;
            case 1:
                page_infos["normal_friends_page_info"].current_page -= 1;
                ui.normal_friend_list.setDataSource(db_util.findAllNormalFriend(page_infos["normal_friends_page_info"].current_page));
                ui.normal_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["normal_friends_page_info"]);
                break;
            case 2:
                page_infos["ignored_friends_page_info"].current_page -= 1;
                ui.ignored_friend_list.setDataSource(db_util.findAllIgnoredFriend(page_infos["ignored_friends_page_info"].current_page));
                ui.ignored_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["ignored_friends_page_info"]);
                break;
        }
    });

    ui.next_page_button.on("click", () => {
        switch (current_page_index) {
            case 0:
                page_infos["abnormal_friends_page_info"].current_page += 1;
                ui.abnormal_friend_list.setDataSource(db_util.findAllAbnormalFriend(page_infos["abnormal_friends_page_info"].current_page));
                ui.abnormal_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["abnormal_friends_page_info"]);
                break;
            case 1:
                page_infos["normal_friends_page_info"].current_page += 1;
                ui.normal_friend_list.setDataSource(db_util.findAllNormalFriend(page_infos["normal_friends_page_info"].current_page));
                ui.normal_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["normal_friends_page_info"]);
                break;
            case 2:
                page_infos["ignored_friends_page_info"].current_page += 1;
                ui.ignored_friend_list.setDataSource(db_util.findAllIgnoredFriend(page_infos["ignored_friends_page_info"].current_page));
                ui.ignored_friend_list.scrollToPosition(0);
                modifyPageInfoShow(page_infos["ignored_friends_page_info"]);
                break;
        }
    });

    ui.viewpager.addOnPageChangeListener({
        // 已选定页面发生改变时触发
        onPageSelected: index => {
            current_page_index = index;
            switch (index) {
                case 0:
                    modifyPageInfoShow(page_infos["abnormal_friends_page_info"]);
                    break;
                case 1:
                    modifyPageInfoShow(page_infos["normal_friends_page_info"]);
                    break;
                case 2:
                    modifyPageInfoShow(page_infos["ignored_friends_page_info"]);
                    break;
            }
        }
    });

    ui.abnormal_friend_list.on("item_bind", (itemView, itemHolder) => {
        itemView.selected_checkbox.on("check", () => {
            itemView.selected_checkbox.enabled = !itemHolder.item["deleted"];
            itemView.friend_remark_text.enabled = !itemHolder.item["deleted"];
            itemView.we_chat_id_text.enabled = !itemHolder.item["deleted"];
            itemView.abnormal_message_text.enabled = !itemHolder.item["deleted"];
        });
        itemView.selected_checkbox.on("click", () => {
            let friend = itemHolder.item;
            let abnormal_message = friend.abnormal_message;
            if (!no_more_warning && itemView.selected_checkbox.checked && language["blacklisted_message"].match(abnormal_message) == null && language["deleted_message"].match(abnormal_message) == null) {
                let selected_no_more_warning = false;
                dialogs.build({
                    title: language["warning"],
                    content: language["selected_warining_alert_dialog_message"],
                    checkBoxPrompt: language["no_more_warning"],
                    positive: language["cancel"],
                    positiveColor: "#008274",
                    negative: language["confirm"],
                    negativeColor: "#CC0000",
                    cancelable: false
                }).on("check", checked => {
                    selected_no_more_warning = checked;
                }).on("positive", () => {
                    itemView.selected_checkbox.checked = false;
                }).on("negative", () => {
                    no_more_warning = selected_no_more_warning;
                    friend["selected"] = true;
                    db_util.modifyFriend(friend);
                }).show();
            } else {
                friend["selected"] = itemView.selected_checkbox.checked;
                db_util.modifyFriend(friend);
            }
        });
    });

    ui.normal_friend_list.on("item_bind", (itemView, itemHolder) => {
        itemView.selected_checkbox.on("check", () => {
            itemView.selected_checkbox.enabled = !itemHolder.item["deleted"];
            itemView.friend_remark_text.enabled = !itemHolder.item["deleted"];
            itemView.we_chat_id_text.enabled = !itemHolder.item["deleted"];
        });
        itemView.selected_checkbox.on("click", () => {
            let friend = itemHolder.item;
            if (!no_more_warning && itemView.selected_checkbox.checked) {
                let selected_no_more_warning = false;
                dialogs.build({
                    title: language["warning"],
                    content: language["selected_warining_alert_dialog_message"],
                    checkBoxPrompt: language["no_more_warning"],
                    positive: language["cancel"],
                    positiveColor: "#008274",
                    negative: language["confirm"],
                    negativeColor: "#CC0000",
                    cancelable: false
                }).on("check", checked => {
                    selected_no_more_warning = checked;
                }).on("positive", () => {
                    itemView.selected_checkbox.checked = false;
                }).on("negative", () => {
                    no_more_warning = selected_no_more_warning;
                    friend["selected"] = true;
                    db_util.modifyFriend(friend);
                }).show();
            } else {
                friend["selected"] = itemView.selected_checkbox.checked;
                db_util.modifyFriend(friend);
            }
        });
    });

    ui.clear_friends_button.on("click", () => {
        dialogs.build({
            content: language["clear_alert_dialog_message"],
            positive: language["cancel"],
            positiveColor: "#008274",
            negative: language["confirm"],
            negativeColor: "#008274",
            cancelable: false
        }).on("negative", () => {
            db_util.deleteAllFriend();
            initUI();
        }).show();
    });
    
    ui.delete_friends_button.on("click", () => {
        let selected = db_util.hasSelectedFriend();
        if (selected) {
            if (app_util.checkInstalledWeChat() && app_util.checkSupportedWeChatVersion() && app_util.checkFile() && app_util.checkService()) {
                dialogs.build({
                    title: language["warning"],
                    content: language["delete_friend_alert_dialog_message"],
                    positive: language["cancel"],
                    positiveColor: "#008274",
                    negative: language["confirm"],
                    negativeColor: "#CC0000",
                    cancelable: false
                }).on("negative", () => {
                    engines.execScriptFile("modules/delete_friends.js", {delay: 500});
                    app_util.stopScript();
                }).show();
            }
        } else {
            dialogs.build({
                content: language["not_select_friend_alert_dialog_message"],
                positive: language["confirm"],
                positiveColor: "#008274",
                cancelable: false
            }).show();
        }
    });

    ui.test_friends_button.on("click", () => {
        if (app_util.checkInstalledWeChat() && app_util.checkSupportedWeChatVersion() && app_util.checkFile() && app_util.checkService()) {
            dialogs.build({
                content: language["before_running_alert_dialog_message"],
                positive: language["confirm"],
                positiveColor: "#008274",
                negative: language["cancel"],
                negativeColor: "#008274",
                cancelable: false
            }).on("positive", () => {
                engines.execScriptFile("modules/test_friends.js", {delay: 500});
                app_util.stopScript();
            }).show();
        }
    });
})();