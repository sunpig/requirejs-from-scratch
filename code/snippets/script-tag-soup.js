
    <script src="/js/lib/ace/src-min/ace.js"></script>
    <script src="/js/lib/jquery-plugins/jquery.csv.js"></script>
    <script src="/js/models/QueryParameterModel.js"></script>
    <script src="/js/collections/QueryParametersCollection.js"></script>
    <script src="/js/models/QueryModel.js"></script>
    <script src="/js/views/ExecuteQueryView.js"></script>
    <script src="/js/views/AceEditorView.js"></script>
    <script src="/js/views/QueryActionsView.js"></script>
    <script src="/js/views/LoggedQueryApp.js"></script>
    <script>
        // Initialize the JS app
        void (new window.FD.LoggedQueryApp({
            el: $('[data-role=LoggedQueryApp]'),
            model: new window.FD.QueryModel({
                runQueryUrl: "{% url 'query_create' %}",
                saveQueryUrl: "{% url 'saved_query_list' %}",
                csrfmiddlewaretoken: "{{ csrf_token }}",
                querySrc: ''
            })
        }).render());
    </script>
